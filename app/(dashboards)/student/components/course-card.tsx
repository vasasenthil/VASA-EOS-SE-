import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Course } from "../types"

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.name}</CardTitle>
        <CardDescription className="line-clamp-3 h-[60px]">
          {course.description || "No description available."}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Link href={`/student/courses/${course.id}`} passHref>
          <Button>View Course</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
