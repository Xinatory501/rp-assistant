import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:window_manager/window_manager.dart';
import 'app_theme.dart';

class ClaudeTitleBar extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final bool showControls;

  const ClaudeTitleBar({
    super.key,
    this.title = 'RP Assistant',
    this.subtitle,
    this.trailing,
    this.showControls = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanStart: (_) => windowManager.startDragging(),
      onDoubleTap: () async {
        if (await windowManager.isMaximized()) {
          await windowManager.unmaximize();
        } else {
          await windowManager.maximize();
        }
      },
      child: Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: const BoxDecoration(
          color: AppColors.titlebarBg,
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: AppColors.accent.withOpacity(0.18),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.accent.withOpacity(0.4)),
              ),
              child: const Center(
                child: Icon(Icons.auto_awesome, size: 11, color: AppColors.accent),
              ),
            ),
            const SizedBox(width: 9),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                letterSpacing: 0.3,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                decoration: BoxDecoration(
                  color: AppColors.bgMid,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Text(
                  subtitle!,
                  style: const TextStyle(fontSize: 9.5, color: AppColors.textMuted),
                ),
              ),
            ],
            const Spacer(),
            if (trailing != null) ...[
              trailing!,
              const SizedBox(width: 8),
            ],
            if (showControls) ...[
              _WindowButton(
                icon: Icons.remove,
                tooltip: 'Свернуть',
                onPressed: () => windowManager.minimize(),
              ),
              _WindowButton(
                icon: Icons.crop_square,
                tooltip: 'Развернуть',
                onPressed: () async {
                  if (await windowManager.isMaximized()) {
                    await windowManager.unmaximize();
                  } else {
                    await windowManager.maximize();
                  }
                },
              ),
              _WindowButton(
                icon: Icons.close,
                tooltip: 'Закрыть',
                isClose: true,
                onPressed: () => windowManager.close(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _WindowButton extends StatefulWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;
  final bool isClose;

  const _WindowButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    this.isClose = false,
  });

  @override
  State<_WindowButton> createState() => _WindowButtonState();
}

class _WindowButtonState extends State<_WindowButton> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: GestureDetector(
        onTap: widget.onPressed,
        child: Container(
          width: 32,
          height: 26,
          decoration: BoxDecoration(
            color: _hover
                ? (widget.isClose ? const Color(0xFFDC2626) : const Color(0x18FFFFFF))
                : Colors.transparent,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Center(
            child: Icon(
              widget.icon,
              size: 13,
              color: _hover
                  ? Colors.white
                  : (widget.isClose ? AppColors.textMuted : AppColors.textSecondary),
            ),
          ),
        ),
      ),
    );
  }
}

class RpButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool outlined;
  final IconData? icon;
  final bool small;

  const RpButton({
    super.key,
    required this.label,
    this.onPressed,
    this.outlined = false,
    this.icon,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    final h = small ? 28.0 : 34.0;
    final fs = small ? 11.0 : 12.0;
    if (outlined) {
      return SizedBox(
        height: h,
        child: OutlinedButton(
          onPressed: onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.textPrimary,
            side: const BorderSide(color: AppColors.border),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            textStyle: TextStyle(fontSize: fs),
            padding: const EdgeInsets.symmetric(horizontal: 10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 12, color: AppColors.accent), const SizedBox(width: 5)],
              Text(label),
            ],
          ),
        ),
      );
    }
    return SizedBox(
      height: h,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: TextStyle(fontSize: fs, fontWeight: FontWeight.w600),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[Icon(icon, size: 12), const SizedBox(width: 5)],
            Text(label),
          ],
        ),
      ),
    );
  }
}

class RpCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final Color? color;
  final Border? border;

  const RpCard({super.key, required this.child, this.padding, this.color, this.border});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color ?? AppColors.bgCard,
        borderRadius: BorderRadius.circular(10),
        border: border ?? Border.all(color: AppColors.border),
      ),
      child: child,
    );
  }
}

class RpTextField extends StatelessWidget {
  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final int? maxLines;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final bool obscureText;

  const RpTextField({
    super.key,
    this.label,
    this.hint,
    this.controller,
    this.maxLines = 1,
    this.validator,
    this.onChanged,
    this.obscureText = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null) ...[
          Text(label!, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          const SizedBox(height: 3),
        ],
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          obscureText: obscureText,
          validator: validator,
          onChanged: onChanged,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 12),
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    );
  }
}

class CopyButton extends StatefulWidget {
  final String text;
  const CopyButton({super.key, required this.text});
  @override
  State<CopyButton> createState() => _CopyButtonState();
}

class _CopyButtonState extends State<CopyButton> {
  bool _copied = false;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(
        _copied ? Icons.check : Icons.copy,
        size: 13,
        color: _copied ? AppColors.accent : AppColors.textMuted,
      ),
      tooltip: 'Скопировать',
      onPressed: () async {
        await Clipboard.setData(ClipboardData(text: widget.text));
        setState(() => _copied = true);
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) setState(() => _copied = false);
      },
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  const SectionHeader(this.title, {super.key});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 4, 0, 4),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: AppColors.textDim,
          fontSize: 9.5,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}