-- Add images column to Course
ALTER TABLE "Course" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
