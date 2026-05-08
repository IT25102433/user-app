package com.examSystem.util;

import java.io.*;
import java.util.*;

public class FileHandler {
    public static void writeToFile(String filePath, String data) {
        try (FileWriter fw = new FileWriter(filePath, true)) {
            fw.write(data + "\n");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static List<String> readFromFile(String filePath) {
        List<String> lines = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                lines.add(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return lines;
    }

    public static void writeListToFile(String filePath, List<String> data) {
        try (FileWriter fw = new FileWriter(filePath)) {
            for (String line : data) {
                fw.write(line + "\n");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
