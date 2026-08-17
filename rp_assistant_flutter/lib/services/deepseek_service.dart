import 'dart:convert';
import 'package:http/http.dart' as http;

class DeepseekMessage {
  final String role;
  final String content;

  const DeepseekMessage({required this.role, required this.content});

  Map<String, dynamic> toJson() => {'role': role, 'content': content};
}

class DeepseekService {
  static const String baseUrl = 'https://api.deepseek.com';

  static Future<String> chat({
    required String apiKey,
    required List<DeepseekMessage> messages,
    String model = 'deepseek-chat',
    double temperature = 0.7,
  }) async {
    final cleanKey = apiKey.trim();
    if (cleanKey.isEmpty) {
      throw Exception('Не указан DeepSeek API ключ в Настройках.');
    }

    final response = await http.post(
      Uri.parse('$baseUrl/chat/completions'),
      headers: {
        'Authorization': 'Bearer $cleanKey',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'model': model,
        'messages': messages.map((m) => m.toJson()).toList(),
        'temperature': temperature,
        'max_tokens': 2048,
        'stream': false,
      }),
    ).timeout(const Duration(seconds: 30));

    if (response.statusCode == 200) {
      final data = json.decode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      final choices = data['choices'] as List<dynamic>?;
      if (choices != null && choices.isNotEmpty) {
        final choice = choices.first as Map<String, dynamic>;
        final message = choice['message'] as Map<String, dynamic>?;
        return message?['content'] as String? ?? '';
      }
      return '';
    } else {
      final errBody = utf8.decode(response.bodyBytes);
      throw Exception('Ошибка DeepSeek (${response.statusCode}): $errBody');
    }
  }
}
