

package com.examSystem.util;
import java.util.regex.Pattern;
public class Validator {
    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@(.+)$";
    public static boolean isValidEmail(String email) {
        if (email == null) return false;
        return Pattern.compile(EMAIL_REGEX).matcher(email).matches();
    }
    public static boolean isStrongPassword(String password) {
        return password != null && password.length() >= 8;
    }
}