"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Globe, 
  Target, 
  Shield, 
  DollarSign, 
  CheckCircle,
  Star,
  Award
} from "lucide-react";
import * as motion from "motion/react-client";

const advantages = [
  {
    icon: Package,
    title: "All-in-One Platform",
    description: "Unlike bits-and-pieces solutions, Shothik AI has every needed functionality, all in one place.",
    highlight: "Complete Suite",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Globe,
    title: "Best for Bangladesh & Beyond",
    description: "Whether you need AI writing tools in Bangladesh or international markets, Shothik.ai delivers.",
    highlight: "Local Intelligence + Global Expertise",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    icon: Target,
    title: "Industry-Leading Accuracy",
    description: "Our AI tools bring you very high accuracy leveraging deeper AI models and advanced technology.",
    highlight: "Advanced NLP & ML",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "Shothik AI protects your data with bank-level encryption and strict privacy protocols.",
    highlight: "Bank-Level Security",
    color: "text-red-600",
    bgColor: "bg-red-50"
  },
  {
    icon: DollarSign,
    title: "Affordable Excellence",
    description: "Access professional AI writing tools at prices designed for every budget.",
    highlight: "Competitive Pricing",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    icon: CheckCircle,
    title: "Comprehensive Marketing Automation",
    description: "Our Meta marketing automation and Facebook ads automation tools help you maximize ROI.",
    highlight: "Maximize Social Media ROI",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  }
];

const comparison = [
  {
    feature: "AI Writing Tools",
    shothik: true,
    grammarly: false,
    quillbot: true,
    others: false
  },
  {
    feature: "Meta Marketing Automation",
    shothik: true,
    grammarly: false,
    quillbot: false,
    others: false
  },
  {
    feature: "AI Agents",
    shothik: true,
    grammarly: false,
    quillbot: false,
    others: false
  },
  {
    feature: "Plagiarism Checker",
    shothik: true,
    grammarly: false,
    quillbot: false,
    others: false
  },
  {
    feature: "Translation Tool (100+ Languages)",
    shothik: true,
    grammarly: false,
    quillbot: false,
    others: false
  },
  {
    feature: "Affordable Pricing",
    shothik: true,
    grammarly: false,
    quillbot: false,
    others: false
  }
];

export default function AboutWhyChoose() {
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
            Why Choose Shothik AI
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            The Smart Choice for AI Writing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover why thousands of users trust Shothik AI for their writing, 
            content creation, and marketing automation needs.
          </p>
        </motion.div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {advantages.map((advantage, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <div className={`inline-flex p-4 rounded-full ${advantage.bgColor} mb-4`}>
                    <advantage.icon className={`h-8 w-8 ${advantage.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-2">
                    {advantage.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {advantage.highlight}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-muted-foreground leading-relaxed">
                    {advantage.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold mb-2">
                How We Compare
              </CardTitle>
              <p className="text-muted-foreground">
                See how Shothik AI stacks up against other popular tools
              </p>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Header */}
                  <div className="grid grid-cols-5 gap-4 mb-6 pb-4 border-b">
                    <div className="font-semibold">Features</div>
                    <div className="text-center font-semibold text-primary">Shothik AI</div>
                    <div className="text-center font-semibold">Grammarly</div>
                    <div className="text-center font-semibold">QuillBot</div>
                    <div className="text-center font-semibold">Others</div>
                  </div>
                  
                  {/* Comparison Rows */}
                  {comparison.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 py-3 border-b last:border-b-0">
                      <div className="font-medium text-sm">{item.feature}</div>
                      <div className="text-center">
                        {item.shothik ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-gray-200 mx-auto" />
                        )}
                      </div>
                      <div className="text-center">
                        {item.grammarly ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-gray-200 mx-auto" />
                        )}
                      </div>
                      <div className="text-center">
                        {item.quillbot ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-gray-200 mx-auto" />
                        )}
                      </div>
                      <div className="text-center">
                        {item.others ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-gray-200 mx-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8 lg:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="flex justify-center mb-4">
                    <Award className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Trusted by Thousands</h3>
                  <p className="text-muted-foreground">
                    Users worldwide trust our platform for their critical writing and marketing needs
                  </p>
                </div>
                <div>
                  <div className="flex justify-center mb-4">
                    <Star className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Industry Recognition</h3>
                  <p className="text-muted-foreground">
                    Recognized as one of the best AI writing platforms in Bangladesh and globally
                  </p>
                </div>
                <div>
                  <div className="flex justify-center mb-4">
                    <Shield className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
                  <p className="text-muted-foreground">
                    Enterprise-grade security ensures your data is always protected and private
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
