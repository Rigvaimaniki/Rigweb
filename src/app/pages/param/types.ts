export type CourseCategory = "Basic" | "Moderate" | "Advance";

export type Course = {
  id: string;
  category: CourseCategory;
  title: string;
  description: string;
  duration: string;
  features: string[];
  pricing: {
    originalInr: number;
    discountPercent: number;
  };
  images?: string[];
};

export type ApiCourse = {
  id: string;
  title: string;
  description: string;
  price: number;
  discountPercent: number;
  duration: string;
  category: "basic" | "moderate" | "advance";
  features: string[];
  images?: string[];
};
