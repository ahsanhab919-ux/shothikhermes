"use client";
import { _socials } from "@/_mock/socials";
import { team } from "@/_mock/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as motion from "motion/react-client";
import Image from "next/image";

const leadershipTeam = team
  .filter(
    (member) =>
      member.designation?.includes("CEO") ||
      member.designation?.includes("Founder") ||
      member.designation?.includes("CTO") ||
      member.designation?.includes("Advisor") ||
    member.designation?.includes("Chief Technology Officer"),
  )
  .slice(0, 4);

export default function TeamLeadership() {
  return (
    <div className="py-20">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <Badge className="mb-4 px-4 py-2 text-sm font-medium">Leadership</Badge>
        <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
          Our Leadership Team
        </h2>
        <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
          The visionaries driving Shothik AI's mission to make AI accessible to
          everyone
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {leadershipTeam.map((leader, index) => (
          <motion.div
            key={leader.id}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
            viewport={{ once: true }}
          >
            <LeaderCard member={leader} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LeaderCard({ member }) {
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
