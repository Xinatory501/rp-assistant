import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_theme.dart';

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
            foregroundColor: AppColors.textMuted,
            side: const BorderSide(color: AppColors.borderLight),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            textStyle: TextStyle(fontSize: fs),
            padding: const EdgeInsets.symmetric(horizontal: 10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 12), const SizedBox(width: 4)],
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
          padding: const EdgeInsets.symmetric(horizontal: 10),
          textStyle: TextStyle(fontSize: fs, fontWeight: FontWeight.w600),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[Icon(icon, size: 12), const SizedBox(width: 4)],
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
      padding: padding ?? const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color ?? AppColors.bgCard,
        borderRadius: BorderRadius.circular(10),
        border: border ?? Border.all(color: AppColors.borderLight),
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
      padding: const EdgeInsets.fromLTRB(0, 8, 0, 4),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: AppColors.textDim,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
