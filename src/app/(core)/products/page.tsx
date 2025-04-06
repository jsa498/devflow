'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

// Define the single FitBull product
const fitBullProduct = {
  id: 'fitbull',
  title: 'FitBull',
  description: 'Stop guessing, start progressing. FitBull is your ultimate workout companion. Log every set, track your lifts, manage multiple routines, and visualize your strength gains. Crush your goals, one rep at a time.',
  imageUrl: '/fitbull/fitbull.JPG', // Path to the FitBull image in the public folder
};

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold tracking-tight mb-12 text-center">
        Our Product
      </h1>

      {/* Display only the FitBull product card */}
      <div className="w-full max-w-sm"> { /* Added container to center and constrain width */}
        <Card key={fitBullProduct.id} className="overflow-hidden flex flex-col">
          <CardContent className="flex-grow flex flex-col items-center text-center pt-0"> { /* Added top padding to CardContent */}
            {/* FitBull Image */}
            <div className="w-full h-75 bg-black rounded-md mb-4 relative">
              <Image
                src={fitBullProduct.imageUrl}
                alt={fitBullProduct.title}
                layout="fill" // Use fill layout
                objectFit="cover" // Changed back to cover for zoom
                className="rounded-md"
              />
            </div>
            <CardDescription>{fitBullProduct.description}</CardDescription>
          </CardContent>
          <CardFooter className="justify-center">
            {/* Keep the button, link functionality can be decided later */}
            {/* <Link href={`/products/${fitBullProduct.id}`} passHref> */}
              <Button>View Details</Button>
            {/* </Link> */}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
