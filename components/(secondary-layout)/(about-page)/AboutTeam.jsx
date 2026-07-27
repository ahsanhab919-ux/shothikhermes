"use client";
import { _socials } from "@/_mock/socials";
import { team } from "@/_mock/team";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as motion from "motion/react-client";
import Image from "next/image";
import { useState } from "react";

export default function AboutTeam() {
  const [_, setCurrentSlide] = useState(0);

  return (
    <div className="pb-10 text-center">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <p className="text-muted-foreground text-sm tracking-wider uppercase">
          DREAM TEAM
        </p>
      </motion.div>

      <motion.div
        initial={{ x: -30, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
      >
        <h2 className="my-2 text-4xl font-bold">Great team is the key</h2>
      </motion.div>

      <motion.div
        initial={{ x: -30, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        viewport={{ once: true }}
      >
        <p className="text-muted-foreground mx-auto max-w-[640px]">
          Shothik will provide you support if you have any problems, our support
          team will reply within a day and we also have detailed documentation.
        </p>
      </motion.div>

      <div className="relative mt-0">
        <Carousel opts={{ align: "start" }} className="relative">
          <CarouselContent>
            {team.map((member, index) => (
              <CarouselItem
                key={index}
                className="px-1 py-10 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <MemberCard member={member} isFirst={index === 0} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Left Arrow */}
          <CarouselPrevious className="bg-background/90 hover:bg-accent/90 absolute top-1/2 left-6 z-10 -translate-y-1/2 rounded-full p-2 shadow-md">
            <ChevronLeft className="text-foreground h-5 w-5" />
          </CarouselPrevious>

          {/* Right Arrow */}
          <CarouselNext className="bg-background/90 hover:bg-accent/90 absolute top-1/2 right-6 z-10 -translate-y-1/2 rounded-full p-2 shadow-md">
            <ChevronRight className="text-foreground h-5 w-5" />
          </CarouselNext>
        </Carousel>
      </div>
    </div>
  );
}

function MemberCard({ member, isFirst }) {
  const { name, designation, image } = member;

  return (
    <Card className="relative mx-auto flex h-[430px] w-[280px] flex-col items-center rounded-lg p-2 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Image
        alt={name}
        src={image}
        style={{
          borderRadius: "10px",
          width: "100%",
          height: "260px",
          objectFit: "cover",
        }}
        height={400}
        width={250}
      />

      <p className="mt-4 mb-1 text-base font-semibold">{name}</p>

      <p className="text-muted-foreground text-sm">{designation}</p>

      {isFirst && (
        <div className="hover:bg-primary">
          <a
            href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1-0YrraZrcWyTUUrowfsWSDMKPOj57Lt8u9X-NcjC2Oz522EPBGzsD4SjjpkUzwHJOMePNPnbw?gv=true"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground absolute top-[63%] left-1/2 w-[200px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded px-4 py-2 font-semibold no-underline"
          >
            Book an appointment
          </a>
        </div>
      )}

      <div className="absolute right-0 bottom-1 left-0 flex flex-row items-center justify-center p-1">
        {member.social.map((link, index) => {
          const social = _socials[index];
          return (
            <Button key={index} variant="ghost" size="icon" asChild>
              <a href={link} target="_blank" rel="noopener noreferrer">
                {social ? (
                  <social.icon style={{ color: social.color }} />
                ) : null}
              </a>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
