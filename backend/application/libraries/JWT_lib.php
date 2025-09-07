<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class JWT_lib {
    
    private $key;
    private $algorithm = 'HS256';
    
    public function __construct() {
        $this->key = 'school_management_jwt_secret_key_2024';
    }
    
    public function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => $this->algorithm]);
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, $this->key, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
    }
    
    public function decode($jwt) {
        $parts = explode('.', $jwt);
        
        if (count($parts) !== 3) {
            return FALSE;
        }
        
        list($base64Header, $base64Payload, $base64Signature) = $parts;
        
        $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Header)), true);
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);
        
        $expectedSignature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, $this->key, true);
        $expectedBase64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignature));
        
        if (!hash_equals($base64Signature, $expectedBase64Signature)) {
            return FALSE;
        }
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return FALSE;
        }
        
        return $payload;
    }
    
    public function generate_token($user_data, $expires_in = 7200) {
        $payload = [
            'iss' => 'school_management_system',
            'aud' => 'school_users',
            'iat' => time(),
            'exp' => time() + $expires_in,
            'user_id' => $user_data['id'],
            'user_type' => $user_data['user_type'],
            'role_id' => isset($user_data['role_id']) ? $user_data['role_id'] : null
        ];
        
        return $this->encode($payload);
    }
    
    public function verify_token($token) {
        return $this->decode($token);
    }
}