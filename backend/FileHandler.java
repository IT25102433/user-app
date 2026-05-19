
package com.examSystem.util;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
public class FileHandler {
    private static final String UPLOAD_DIR = "uploads/";
    public static void saveFile(byte[] fileData, String fileName) throws IOException {
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        Path path = Paths.get(UPLOAD_DIR + fileName);
        Files.write(path, fileData);
    }
}
