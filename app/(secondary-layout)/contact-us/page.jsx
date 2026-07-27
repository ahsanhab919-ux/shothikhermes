import ContactHero from "@/components/(secondary-layout)/(contact-us-page)/ContacHero";
import ContactForm from "@/components/(secondary-layout)/(contact-us-page)/ContactForm";
import Image from "next/image";

export async function generateMetadata() {
  return {
    title: "Contact Us | Shothik AI",
    description: "This is Contact Us page",
  };
}

export default function ContactPage() {
  return (
    <>
      <ContactHero />

      <div className="container mx-auto px-4 py-40">
        <div className="grid grid-cols-1 gap-40 md:grid-cols-2">
          <ContactForm />

          <Image
            src="/location.png"
            height={400}
            width={400}
            alt="Location"
            className="h-full w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </>
  );
}
