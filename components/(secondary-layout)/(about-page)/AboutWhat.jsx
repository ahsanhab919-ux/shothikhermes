import { Progress } from "@/components/ui/progress";
import * as motion from "motion/react-client";
import Image from "next/image";

const keyPoints = [
  {
    label: "Quality",
    value: 100,
  },
  {
    label: "Accuracy",
    value: 100,
  },
  {
    label: "AI Detector",
    value: 100,
  },
  {
    label: "Humanize GPT",
    value: 100,
  },
];

export default function AboutWhat() {
  return (
    <div className="text-center sm:text-left pt-20 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 justify-center items-center">
        <div className="hidden md:block md:col-span-1 lg:col-span-7 pr-0 md:pr-7">
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Image
                  alt="our office 1"
                  src="/secondary/what_1.jpg"
                  height={400}
                  width={400}
                  style={{
                    borderRadius: "20px",
                    boxShadow: "-40px 40px 80px rgba(0, 0, 0, 0.2)",
                  }}
                />
              </motion.div>
            </div>
            <div>
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Image
                  alt="our office 2"
                  src="/secondary/what_2.jpg"
                  height={300}
                  width={400}
                  style={{ borderRadius: "20px" }}
                />
              </motion.div>
            </div>
          </div>
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-5">
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-3">
              What is Shothik AI?
            </h2>
            <p className="text-muted-foreground">
              The ultimate writing tool powered by AI. From rephrasing sentences
              to improving grammar and vocabulary, Shothik AI helps you produce
              polished, professional-grade writing every time.
            </p>
          </motion.div>

          <div className="my-5">
            {keyPoints.map((progress, i) => (
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 * (i + 1) }}
                viewport={{ once: true }}
                key={progress.label}
              >
                <ProgressItem progress={progress} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressItem({ progress }) {
  const { label, value } = progress;

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center">
        <p className="text-sm font-semibold">{label}&nbsp;-&nbsp;</p>
        <p className="text-sm text-muted-foreground">
          {value}%
        </p>
      </div>

      <Progress value={value} className="h-2" />
    </div>
  );
}
