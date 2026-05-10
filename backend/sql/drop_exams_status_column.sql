-- Run once in MySQL Workbench (exam_system database) to remove the unused `status` column.
-- The JPA entity does not map this field; it was only populated when older UI sent `status` in JSON.

USE exam_system;

ALTER TABLE exams DROP COLUMN status;
