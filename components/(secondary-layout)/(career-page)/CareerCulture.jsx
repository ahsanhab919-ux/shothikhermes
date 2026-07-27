import { Card, CardContent } from "@/components/ui/card";
import { Award, Globe, Rocket, Users } from "lucide-react";
import * as motion from "motion/react-client";

const cultureValues = [
  {
    title: "Innovation First",
    description: "Pushing boundaries of AI technology and creative solutions",
    Icon: Rocket,
  },
  {
    title: "User-Centric",
    description: "Every feature designed with user success in mind",
    Icon: Users,
  },
  {
    title: "Quality Excellence",
    description: "Delivering reliable, accurate AI tools that users trust",
    Icon: Award,
  },
  {
    title: "Global Impact",
    description:
      "Making AI accessible to users worldwide, especially in Bangladesh",
    Icon: Globe,
  },
];

export default function CareerCulture() {
  return (
    <div className="py-20">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Our Culture & Values
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          The principles that guide everything we do at Shothik AI
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cultureValues.map((value, index) => (
          <motion.div
            key={index}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
                  <value.Icon className="text-primary h-6 w-6" />
                </div>
                <h4 className="mb-2 text-lg font-semibold">{value.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
