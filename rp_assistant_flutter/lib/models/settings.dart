class AppSettings {
  final String hotkey;
  final String hotkeyAlt;
  final double opacity;
  final String accentColor;
  final bool streamerMode;
  final bool isPremium;
  final String premiumKey;
  final bool firstRun;
  final String deepseekApiKey;
  final bool autoScreenshot;
  final bool autoScreenshotSort;
  final bool autoMask;
  final int megCooldown;
  final String partnerId;
  final bool isLoggedIn;
  final String username;
  final String userEmail;
  final String licenseExpiry;
  final bool isOverlayMode;
  final String customGamePath;
  final String overlayAttachmentMode; // 'game_bound' or 'floating'

  const AppSettings({
    this.hotkey = 'Insert',
    this.hotkeyAlt = 'Alt+X',
    this.opacity = 0.95,
    this.accentColor = '#d97757',
    this.streamerMode = false,
    this.isPremium = false,
    this.premiumKey = '',
    this.firstRun = true,
    this.deepseekApiKey = '',
    this.autoScreenshot = false,
    this.autoScreenshotSort = false,
    this.autoMask = false,
    this.megCooldown = 15,
    this.partnerId = '',
    this.isLoggedIn = false,
    this.username = '',
    this.userEmail = '',
    this.licenseExpiry = '',
    this.isOverlayMode = false,
    this.customGamePath = '',
    this.overlayAttachmentMode = 'game_bound',
  });

  AppSettings copyWith({
    String? hotkey,
    String? hotkeyAlt,
    double? opacity,
    String? accentColor,
    bool? streamerMode,
    bool? isPremium,
    String? premiumKey,
    bool? firstRun,
    String? deepseekApiKey,
    bool? autoScreenshot,
    bool? autoScreenshotSort,
    bool? autoMask,
    int? megCooldown,
    String? partnerId,
    bool? isLoggedIn,
    String? username,
    String? userEmail,
    String? licenseExpiry,
    bool? isOverlayMode,
    String? customGamePath,
    String? overlayAttachmentMode,
  }) {
    return AppSettings(
      hotkey: hotkey ?? this.hotkey,
      hotkeyAlt: hotkeyAlt ?? this.hotkeyAlt,
      opacity: opacity ?? this.opacity,
      accentColor: accentColor ?? this.accentColor,
      streamerMode: streamerMode ?? this.streamerMode,
      isPremium: isPremium ?? this.isPremium,
      premiumKey: premiumKey ?? this.premiumKey,
      firstRun: firstRun ?? this.firstRun,
      deepseekApiKey: deepseekApiKey ?? this.deepseekApiKey,
      autoScreenshot: autoScreenshot ?? this.autoScreenshot,
      autoScreenshotSort: autoScreenshotSort ?? this.autoScreenshotSort,
      autoMask: autoMask ?? this.autoMask,
      megCooldown: megCooldown ?? this.megCooldown,
      partnerId: partnerId ?? this.partnerId,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      username: username ?? this.username,
      userEmail: userEmail ?? this.userEmail,
      licenseExpiry: licenseExpiry ?? this.licenseExpiry,
      isOverlayMode: isOverlayMode ?? this.isOverlayMode,
      customGamePath: customGamePath ?? this.customGamePath,
      overlayAttachmentMode: overlayAttachmentMode ?? this.overlayAttachmentMode,
    );
  }

  Map<String, dynamic> toJson() => {
    'hotkey': hotkey,
    'hotkeyAlt': hotkeyAlt,
    'opacity': opacity,
    'accentColor': accentColor,
    'streamerMode': streamerMode,
    'isPremium': isPremium,
    'premiumKey': premiumKey,
    'firstRun': firstRun,
    'deepseekApiKey': deepseekApiKey,
    'autoScreenshot': autoScreenshot,
    'autoScreenshotSort': autoScreenshotSort,
    'autoMask': autoMask,
    'megCooldown': megCooldown,
    'partnerId': partnerId,
    'isLoggedIn': isLoggedIn,
    'username': username,
    'userEmail': userEmail,
    'licenseExpiry': licenseExpiry,
    'isOverlayMode': isOverlayMode,
    'customGamePath': customGamePath,
    'overlayAttachmentMode': overlayAttachmentMode,
  };

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
    hotkey: json['hotkey'] as String? ?? 'Insert',
    hotkeyAlt: json['hotkeyAlt'] as String? ?? 'Alt+X',
    opacity: (json['opacity'] as num?)?.toDouble() ?? 0.95,
    accentColor: json['accentColor'] as String? ?? '#d97757',
    streamerMode: json['streamerMode'] as bool? ?? false,
    isPremium: json['isPremium'] as bool? ?? false,
    premiumKey: json['premiumKey'] as String? ?? '',
    firstRun: json['firstRun'] as bool? ?? true,
    deepseekApiKey: json['deepseekApiKey'] as String? ?? '',
    autoScreenshot: json['autoScreenshot'] as bool? ?? false,
    autoScreenshotSort: json['autoScreenshotSort'] as bool? ?? false,
    autoMask: json['autoMask'] as bool? ?? false,
    megCooldown: json['megCooldown'] as int? ?? 15,
    partnerId: json['partnerId'] as String? ?? '',
    isLoggedIn: json['isLoggedIn'] as bool? ?? false,
    username: json['username'] as String? ?? '',
    userEmail: json['userEmail'] as String? ?? '',
    licenseExpiry: json['licenseExpiry'] as String? ?? '',
    isOverlayMode: json['isOverlayMode'] as bool? ?? false,
    customGamePath: json['customGamePath'] as String? ?? '',
    overlayAttachmentMode: json['overlayAttachmentMode'] as String? ?? 'game_bound',
  );
}

