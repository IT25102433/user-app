package com.examSystem.util;

public class Validator {
    public static boolean isNotEmpty(String str) {
        return str != null && !str.trim().isEmpty();
    }
}