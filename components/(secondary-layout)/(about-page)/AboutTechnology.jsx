"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, 
  Brain, 
  TrendingUp, 
  Globe, 
  Zap, 
  Languages,
  Users,
  Target
} from "lucide-react";
import * as motion from "motion/react-client";

const technologyFeatures = [
  {
    icon: Cpu,
    title: "Cutting Edge AI Architecture",
    description: "Everything from our AI automatic writing tool, paraphrasing tool to our plagiarism checker products and humanized AI features are built on the most advanced NLP and Machine Learning technology.",
    highlight: "Advanced NLP & ML",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Brain,
    title: "Multi-Model Intelligence",
    description: "Different tools have different AI models. We use different models in our paraphrasing tool than we do in our plagiarism checker and Meta marketing automation system - making them better.",
    highlight: "Specialized Models",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: TrendingUp,
    title: "Learnful Technology",
    description: "Shothik.AI including AI writing tool and a paraphrasing tool gets smarter over time with machine learning as well as user inputs.",
    highlight: "Continuous Learning",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Utilize our grammar checker, AI summarizer, or translation tool in real-time and receive results instantaneously.",
    highlight: "Real-time Results",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  }
];

const globalImpact = [
  {
    icon: Globe,
    value: "150+",
    label: "Countries Served",
    description: "Shothik AI is not just an AI writing tool for Bangladesh - it serves 150+ countries across the globe"
  },
  {
    icon: Target,
    value: "Millions",
    label: "Words Processed Monthly",
    description: "Our AI writing assistant, paraphrasing tool, and word converter receive millions of documents every month"
  },
  {
    icon: Languages,
    value: "160+",
    label: "Languages Supported",
    description: "Translate any combination of 160 different languages with our advanced translation tool"
  },
  {
    icon: Users,
    value: "Thousands",
    label: "Active Users",
    description: "Expanding user base that believes in Shothik.ai for their AI creative writing needs"
  }
];

const futureDevelopments = [
  "Advanced collaboration features",
  "Enhanced AI writing tool capabilities",
  "Deeper Meta marketing automation integration",
  "Expanded translation tool language support",
  "More powerful AI agents",
  "Improved Facebook ads automation",
  "Industry-specific AI writing tool templates"
];

export default function AboutTechnology() {
  return (
    <div className="py-20 px-4 sm:px-6 md:px-10 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 text-sm font-medium">
            Shothik AI Technology & Impact
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Powered by Advanced AI Technology
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our cutting-edge technology and global reach make Shothik AI the trusted 
            choice for content creators and marketers worldwide.
          </p>
        </motion.div>

        {/* Technology Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {technologyFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <div className={`inline-flex p-4 rounded-full ${feature.bgColor} mb-4`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg font-semibold mb-2">
                    {feature.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {feature.highlight}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Global Impact Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">
              Shothik AI Global Impact
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Making a difference worldwide with our AI-powered solutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {globalImpact.map((impact, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <impact.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">{impact.value}</div>
                    <h4 className="text-lg font-semibold mb-3">{impact.label}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {impact.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Future Developments */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold mb-2">
                The Future of Shothik AI
              </CardTitle>
              <p className="text-muted-foreground">
                We're continually updating our AI tools with cutting-edge features
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {futureDevelopments.map((development, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{development}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Meta Marketing Success */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 lg:p-12 text-center">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                  Meta Marketing Success
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Our Meta marketing automation with Facebook ads automation gets you results you can measure.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">300%</div>
                    <div className="text-sm text-muted-foreground">ROI Increase</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">20+ hrs</div>
                    <div className="text-sm text-muted-foreground">Time Saved Weekly</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">95%</div>
                    <div className="text-sm text-muted-foreground">Campaign Success Rate</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
