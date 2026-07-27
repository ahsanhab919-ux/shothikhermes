"use client";
import { _socials } from "@/_mock/socials";
import { team } from "@/_mock/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as motion from "motion/react-client";
import Image from "next/image";

export default function TeamMembers() {
  return (
    <div className="py-20">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <Badge className="mb-4 px-4 py-2 text-sm font-medium">Full Team</Badge>
        <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Meet Everyone
        </h2>
        <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
          The talented individuals making Shothik AI possible
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {team
          .sort((a, b) => a.order - b.order)
          .map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.05 * (index + 1) }}
              viewport={{ once: true }}
            >
              <MemberCard member={member} isFirst={index === 0} />
            </motion.div>
          ))}
      </div>
    </div>
  );
}

function MemberCard({ member, isFirst }) {
  const { name, designation, image } = member;

  return (
    <Card className="relative mx-auto flex h-[430px] w-full max-w-[280px] flex-col items-center rounded-lg p-2 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
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
