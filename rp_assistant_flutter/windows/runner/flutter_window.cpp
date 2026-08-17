#include "flutter_window.h"

#include <optional>

#include "flutter/generated_plugin_registrant.h"

FlutterWindow::FlutterWindow(const flutter::DartProject& project)
    : project_(project) {}

FlutterWindow::~FlutterWindow() {}

bool FlutterWindow::OnCreate() {
  if (!Win32Window::OnCreate()) {
    return false;
  }

  RECT frame = GetClientArea();

  flutter_controller_ = std::make_unique<flutter::FlutterViewController>(
      frame.right - frame.left, frame.bottom - frame.top, project_);
  if (!flutter_controller_->engine() || !flutter_controller_->view()) {
    return false;
  }
  RegisterPlugins(flutter_controller_->engine());
  SetChildContent(flutter_controller_->view()->GetNativeWindow());

  this->Show();

  flutter_controller_->engine()->SetNextFrameCallback([&]() {
    this->Show();
  });

  flutter_controller_->ForceRedraw();

  // Register native global hotkeys:
  // 1001: Insert key
  // 1002: Alt + X
  HWND hwnd = GetHandle();
  if (hwnd) {
    ::RegisterHotKey(hwnd, 1001, 0, VK_INSERT);
    ::RegisterHotKey(hwnd, 1002, MOD_ALT, 'X');
  }

  return true;
}

void FlutterWindow::OnDestroy() {
  HWND hwnd = GetHandle();
  if (hwnd) {
    ::UnregisterHotKey(hwnd, 1001);
    ::UnregisterHotKey(hwnd, 1002);
  }

  if (flutter_controller_) {
    flutter_controller_ = nullptr;
  }

  Win32Window::OnDestroy();
}

LRESULT
FlutterWindow::MessageHandler(HWND hwnd, UINT const message,
                              WPARAM const wparam,
                              LPARAM const lparam) noexcept {
  if (message == WM_HOTKEY) {
    if (wparam == 1001 || wparam == 1002) {
      if (::IsWindowVisible(hwnd)) {
        ::ShowWindow(hwnd, SW_HIDE);
      } else {
        ::ShowWindow(hwnd, SW_SHOW);
        ::SetForegroundWindow(hwnd);
      }
      return 0;
    }
  }

  if (flutter_controller_) {
    std::optional<LRESULT> result =
        flutter_controller_->HandleTopLevelWindowProc(hwnd, message, wparam,
                                                      lparam);
    if (result) {
      return *result;
    }
  }

  switch (message) {
    case WM_FONTCHANGE:
      flutter_controller_->engine()->ReloadSystemFonts();
      break;
  }

  return Win32Window::MessageHandler(hwnd, message, wparam, lparam);
}
