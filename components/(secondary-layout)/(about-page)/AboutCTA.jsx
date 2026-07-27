"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Star, 
  CheckCircle, 
  Zap,
  Users,
  Shield
} from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";

const benefits = [
  {
    icon: CheckCircle,
    title: "Start Free",
    description: "No credit card required. Try all features immediately."
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get professional results in seconds, not hours."
  },
  {
    icon: Users,
    title: "Join Thousands",
    description: "Trusted by content creators worldwide."
  },
  {
    icon: Shield,
    title: "100% Secure",
    description: "Your data is protected with enterprise-grade security."
  }
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "150+", label: "Countries" },
  { value: "95%", label: "Satisfaction" },
  { value: "24/7", label: "Support" }
];

export default function AboutCTA() {
  return (
    <div className="py-20 px-4 sm:px-6 md:px-10 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto">
        {/* Main CTA Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          {/* <Badge className="mb-4 px-4 py-2 text-sm font-medium">
            Your Complete AI Solution
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Writing?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Shothik AI offers an all-in-one solution, from our cutting-edge AI writing tool 
            and paraphrasing tool to the world's leading plagiarism checker, grammar checker, 
            article rewriter, AI humanizer, Meta marketing automation and everything in between.
          </p> */}
          
          {/* Primary CTA Buttons */}
          {/* <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/tools" className="no-underline">
              <Button size="lg" className="px-8 py-3 text-base h-12">
                Start Writing Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing" className="no-underline">
              <Button variant="outline" size="lg" className="px-8 py-3 text-base h-12">
                View Pricing Plans
              </Button>
            </Link>
          </div> */}

          {/* Trust Indicators */}
          {/* <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="font-semibold">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">SSL Secured</span>
            </div>
          </div> */}
        </motion.div>

        {/* Benefits Grid */}
        {/* <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div> */}

        {/* Stats Section */}
        {/* <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8 lg:p-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div> */}

        {/* Final CTA */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-1">
              <CardContent className="p-8 lg:p-12 text-center bg-background">
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                  Join the AI Writing Revolution
                </h3>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Start creating better content today with the most comprehensive AI writing 
                  and marketing automation platform available.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register" className="no-underline">
                    <Button size="lg" className="px-8 py-3 text-base h-12">
                      Get Started Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo" className="no-underline">
                    <Button variant="outline" size="lg" className="px-8 py-3 text-base h-12">
                      Request Demo
                    </Button>
                  </Link>
                </div>
                
                {/* Small Print */}
                <div className="mt-6 text-xs text-muted-foreground">
                  No credit card required • Cancel anytime • 24/7 support
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
