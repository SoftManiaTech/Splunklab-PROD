"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SoftmaniaLogo } from "@/components/softmania-logo"
import Link from 'next/link';
import Salesiq from "@/components/salesiq"
import {
  Server,
  Database,
  Network,
  CheckCircle,
  Star,
  Play,
  X,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Headphones,
  Mail,
  Video,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Settings,
  Download,
  Share2,
  UserRoundCheck,
  Check,
  ExternalLink,
} from "lucide-react"

interface EnvironmentOption {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  description: string
  features: string[]
  info: string[]
  components?: string[]
  pricing: { amount: number; days?: number; hours: number, popular?: boolean, paymentLink: string }[]
  redirectUrl: string
  color: string
  bgColor: string
  demoVideoId: string
  demoTitle: string
  demoDuration: string
}

const environments: EnvironmentOption[] = [
  {
    id: "standalone",
    title: " Splunk Standalone",
    subtitle: "Perfect for Learning",
    icon: <Server className="w-6 h-6" />,
    description: "Single instance with BOTSv3 dataset for hands-on security training and threat hunting practice.",
    features: [
      "Pre-configured Splunk instance (optional)",
      "BOTSv3 Security Dataset (Real-world logs for threat hunting). (optional)",
      "Supporting Add-ons for seamless data ingestion. (optional)",
    ],
    info: ["OS: Red Hat-9", "Splunk Enterprise Version: 9.4.1"],
    components: ["Splunk Enterprise"],
    pricing: [
      { amount: 100, hours: 10, paymentLink: "https://softmania.com/pay/standalone/100" },
      { amount: 200, hours: 21, paymentLink: "https://softmania.com/pay/standalone/100" },
      { amount: 300, hours: 33, paymentLink: "https://softmania.com/pay/standalone/100" },
      { amount: 400, hours: 45, paymentLink: "https://softmania.com/pay/standalone/100" },
      { amount: 500, hours: 56, paymentLink: "https://softmania.com/pay/standalone/100" },
    ],
    redirectUrl: "https://softmania.com/splunk-standalone-lab",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    demoVideoId: "dQw4w9WgXcQ",
    demoTitle: "Standalone Server Complete Walkthrough",
    demoDuration: "8:45"
  },
  {
    id: "distributed",
    title: "Splunk Distributed Non-Clustered",
    subtitle: "Scalable Architecture",
    icon: <Network className="w-6 h-6" />,
    description: "Multi-component architecture with search head, indexer, and forwarders for realistic deployments.",
    features: [
      "4-component architecture",
      "Distributed search capabilities",
      "BOTSv3 Security Dataset (Real-world logs for threat hunting). (optional)",
    ],
    info: ["OS: Red Hat-9", "Splunk Enterprise Version: 9.4.1"],
    components: ["Search Head", "Indexer", "Heavy Forwarder", "Universal Forwarder"],
    pricing: [
      { amount: 200, hours: 4, paymentLink: "https://softmania.com/pay/standalone/100" },
      { amount: 500, hours: 13, paymentLink: "https://softmania.com/pay/standalone/100" },
      { amount: 1000, hours: 27, paymentLink: "https://pages.razorpay.com/Splunk-DC-1000", popular: true },
      { amount: 1500, hours: 42, paymentLink: "https://softmania.com/pay/standalone/100" },
    ],
    redirectUrl: "https://softmania.com/splunk-distributed-lab",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    demoVideoId: "dQw4w9WgXcQ",
    demoTitle: "Distributed Environment Deep Dive",
    demoDuration: "12:30"
  },
  {
    id: "clustered",
    title: "Splunk Distributed Cluster",
    subtitle: "High Availability",
    icon: <Database className="w-6 h-6" />,
    description:
      "Full enterprise deployment with clustering, load balancing, and fault tolerance for production scenarios.",
    features: [
      "Search head cluster (3 nodes)",
      "Indexer cluster (3 nodes)",
      "Management server features (Deployer, License manager, Deployment server, Monitoring Console)",
    ],
    info: ["OS: Red Hat-9", "Splunk Enterprise Version: 9.4.1"],
    components: ["SH Cluster", "IDX Cluster", "Cluster Master", "HF", "Management server"],
    pricing: [
      { amount: 1000, hours: 11, paymentLink: "https://softmania.com/pay/standalone/100" },
      { amount: 2000, hours: 23, paymentLink: "https://softmania.com/pay/standalone/100" },
      { amount: 3000, hours: 37, paymentLink: "https://softmania.com/pay/standalone/100", popular: true },
      { amount: 4000, hours: 49, paymentLink: "https://softmania.com/pay/standalone/100" },
      { amount: 5000, hours: 62, paymentLink: "https://softmania.com/pay/standalone/100" },
    ],
    redirectUrl: "https://softmania.com/splunk-cluster-lab",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
    demoVideoId: "dQw4w9WgXcQ",
    demoTitle: "Enterprise Cluster Architecture Tour",
    demoDuration: "15:20"
  },
]

export default function LabEnvironments() {
  const [selectedPricing, setSelectedPricing] = useState<Record<string, { amount: number; days: number }>>({})
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<EnvironmentOption | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const router = useRouter()

  const handleRedirect = (url: string, envId?: string) => {
    if (envId && selectedPricing[envId]) {
      const pricing = selectedPricing[envId]
      const urlWithParams = `${url}?amount=${pricing.amount}&days=${pricing.days}`
      window.open(urlWithParams, "_blank")
    } else {
      window.open(url, "_blank")
    }
  }

  const handlePricingSelect = (envId: string, pricing: { amount: number; days: number }) => {
    setSelectedPricing((prev) => ({ ...prev, [envId]: pricing }))
  }

  const handleViewDemo = (env: EnvironmentOption) => {
    setCurrentVideo(env)
    setShowVideoModal(true)
    setIsPlaying(true)
  }

  const handleContactOption = (type: "call" | "whatsapp" | "email" | "schedule") => {
    switch (type) {
      case "call":
        window.open("tel:+919876543210", "_self")
        break
      case "whatsapp":
        window.open("https://wa.me/919876543210?text=Hi, I'm interested in Splunk Lab Environments", "_blank")
        break
      case "email":
        window.open("mailto:sales@softmania.com?subject=Splunk Lab Environment Inquiry", "_self")
        break
      case "schedule":
        window.open("https://calendly.com/softmania-sales", "_blank")
        break
    }
    setShowContactModal(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" passHref>
              <SoftmaniaLogo size="md" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="m-[4px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 shadow-sm"
              onClick={() => router.push("/lab")}
            >
              <UserRoundCheck className="mr-2" />
              MyLab
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContactModal(true)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact Sales
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Splunk Lab Environments
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Choose the perfect environment for your Splunk learning journey
            </p>
          </div>
        </div>
      </section>

      {/* Environment Cards - All 3 in Same Style */}
      <section className="pb-12 sm:pb-16 lg:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {environments.map((env) => (
              <Card
                key={env.id}
                className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
              >
                <CardHeader className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`p-3 rounded-xl ${env.bgColor} ${env.color} group-hover:scale-110 transition-transform duration-300`}
                    >
                      {env.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {env.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{env.subtitle}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{env.description}</p>
                      {selectedPricing[env.id] && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />₹{selectedPricing[env.id].amount} for{" "}
                          {selectedPricing[env.id].days} days
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-6">
                  {/* Features */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Key Features
                    </h3>
                    <div className="space-y-2">
                      {env.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Components */}
                  {env.components && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-600" />
                        Components
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {env.components.map((component, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs py-1 px-2 hover:scale-105 transition-transform duration-200"
                          >
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Info
                    </h3>
                    <div className="space-y-2">
                      {env.info.map((info, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{info}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Choose Package</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {env.pricing.map((option, index) => (
                        <div
                          key={index}
                          onClick={() => window.open(option.paymentLink, "_blank")}
                          className={`relative p-3 rounded-lg border text-center cursor-pointer transition-all duration-300 hover:scale-105 ${selectedPricing[env.id]?.amount === option.amount
                            ? "border-green-500 bg-green-50 dark:bg-green-950/50 ring-1 ring-green-200 dark:ring-green-800 shadow-md"
                            : option.popular
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-sm"
                              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                            }`}
                        >
                          {selectedPricing[env.id]?.amount === option.amount && (
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-green-600 text-white text-xs animate-pulse">
                                <CheckCircle className="w-2 h-2 mr-1" />
                                Selected
                              </Badge>
                            </div>
                          )}
                          {option.popular && selectedPricing[env.id]?.amount !== option.amount && (
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-blue-600 text-white text-xs animate-bounce">
                                <Star className="w-2 h-2 mr-1" />
                                Popular
                              </Badge>
                            </div>
                          )}

                          {/* External link icon */}
                          <ExternalLink className="absolute top-2 right-2 w-4 h-4 text-gray-300 dark:text-gray-500" />

                          <div className="text-lg font-bold text-gray-900 dark:text-white">₹{option.amount}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {option.hours} {option.hours === 1 ? "hour" : "hours"}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            ₹{Math.round(option.amount / option.hours)}/Hours
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Demo Video Preview
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Video className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{env.demoTitle}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {env.demoDuration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleViewDemo(env)}
                      className="w-full transition-all duration-300 hover:scale-105 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch Demo
                    </Button>
                  </div> */}

                  {/* Action Buttons
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={() => {
                        if (selectedPricing[env.id]) {
                          handleRedirect(env.redirectUrl, env.id)
                        }
                      }}
                      disabled={!selectedPricing[env.id]}
                      className={`w-full ${
                        selectedPricing[env.id]
                          ? `${env.color.replace("text-", "bg-").replace("600", "600")} hover:opacity-300 text-gray-900 hover:text-white shadow-lg hover:shadow-xl`
                          : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-200 cursor-not-allowed"
                      } transition-all duration-300 hover:scale-105`}
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {selectedPricing[env.id] ? `Launch - ₹${selectedPricing[env.id].amount}` : "Select Package First"}
                    </Button>
                  </div> */}

                  {/* Info Box
                  <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">What's Included</p>
                        <p className="text-blue-800 dark:text-blue-200">
                          Instant deployment • Technical support • Lab guides
                        </p>
                      </div>
                    </div>
                  </div> */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-lg mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Contact Our Sales Team
            </DialogTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your preferred way to connect with our Splunk experts
            </p>
          </DialogHeader>
          <div className="space-y-4 p-6 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleContactOption("call")}
                className="bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Phone className="w-6 h-6 group-hover:animate-pulse" />
                <div className="text-center">
                  {/* <div className="font-medium">Call Back</div> */}
                  {/* <div className="text-xs opacity-90">Within 5 mins</div> */}
                </div>
              </Button>
              <Button
                onClick={() => handleContactOption("whatsapp")}
                className="bg-green-600 hover:bg-green-700 text-white flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <MessageCircle className="w-6 h-6 group-hover:animate-bounce" />
                <div className="text-center">
                  <div className="font-medium">WhatsApp</div>
                  <div className="text-xs opacity-90">Instant chat</div>
                </div>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleContactOption("email")}
                variant="outline"
                className="flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                <Mail className="w-6 h-6 group-hover:animate-pulse" />
                <div className="text-center">
                  <div className="font-medium">Email Us</div>
                  <div className="text-xs opacity-70">Get details</div>
                </div>
              </Button>
              <Button
                onClick={() => handleContactOption("schedule")}
                variant="outline"
                className="flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                <Calendar className="w-6 h-6 group-hover:animate-pulse" />
                <div className="text-center">
                  <div className="font-medium">Schedule</div>
                  <div className="text-xs opacity-70">Book meeting</div>
                </div>
              </Button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Headphones className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Expert Support Available</p>
                  <p className="text-xs">Our Splunk certified team is ready to help you choose the right environment</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setShowContactModal(false)} className="w-full mt-4">
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-6xl w-full p-0 bg-black border-0 overflow-hidden shadow-2xl">
          {/* Video Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-600 rounded-lg">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white font-semibold text-lg">{currentVideo?.demoTitle}</DialogTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-300 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {currentVideo?.demoDuration}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVideoModal(false)}
                className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Video Player */}
          {currentVideo && (
            <div className="relative aspect-video bg-black group">
              <iframe
                src={`https://www.youtube.com/embed/${currentVideo.demoVideoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=0`}
                title={currentVideo.demoTitle}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />

              {/* Custom Premium Controls */}
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                {/* Progress Bar */}
                <div className="w-full bg-white/20 rounded-full h-1 mb-4">
                  <div className="bg-red-600 h-1 rounded-full w-1/3 transition-all duration-300"></div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                    <span className="text-sm font-medium">2:45 / {currentVideo.demoDuration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600 text-white text-xs">HD</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                    >
                      <Maximize className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Info Panel */}
          <div className="bg-gray-900 text-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{currentVideo?.title} Environment Demo</h3>
                {/* <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Watch this comprehensive walkthrough to see the {currentVideo?.title.toLowerCase()} environment in
                  action. Learn about the features, interface, and capabilities before making your decision. This demo
                  covers setup, configuration, and real-world use cases.
                </p> */}

              </div>
              <div className={`p-3 rounded-xl ${currentVideo?.bgColor} ${currentVideo?.color} ml-6`}>
                {currentVideo?.icon}
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* CTA Section
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Join thousands of professionals mastering Splunk with hands-on experience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowContactModal(true)}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Talk to Expert
              </Button>
              <Button variant="outline" size="lg" className="transition-all duration-300 hover:scale-105">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section> */}


      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-green-600 tracking-tight">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto dark:text-gray-800 tracking-tight">
            <Accordion type="single" collapsible className="w-full">

              <AccordionItem value="what-is-this">
                <AccordionTrigger>What does this lab service provide?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-600">
                    We offer hourly-based Splunk lab environments with pre-loaded demo datasets (like BOTSv3), Splunk add-ons, and ready-to-use setups such as standalone, non-clustered distributed, and clustered environments.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="who-is-this-for">
                <AccordionTrigger>Who is this Splunk lab for?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-600">
                    This lab is perfect for beginners, learners preparing for certifications, or professionals wanting hands-on experience in a real-time Splunk environment without having to set it up from scratch.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="support-available">
                <AccordionTrigger>Is 24/7 support included?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-600">
                    No, we do not provide 24/7 support. However, free basic course guidance is available to help you get started with the lab environment.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="demo-dataset">
                <AccordionTrigger>What demo data is included?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-600">
                    We include popular datasets like <strong>BOTSv3</strong> to help you simulate real-world security scenarios inside your lab.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="env-types">
                <AccordionTrigger>Can I choose different types of environments?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-600">
                    Yes. You can request standalone, non-clustered distributed, or fully clustered Splunk environments depending on your learning goals.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cert-prep">
                <AccordionTrigger>Is this lab suitable for certification practice?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-600">
                    Absolutely. This lab setup is ideal for certification practice, lab exercises, and real-time scenario testing with Splunk.
                  </p>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left Side: Logo + Copyright */}
            <div className="flex flex-col items-center sm:items-start gap-1 text-sm text-gray-600 dark:text-gray-400">
              <SoftmaniaLogo size="sm" />
              <p>© {new Date().getFullYear()} Softmania. All rights reserved.</p>
            </div>

            {/* Right Side: Links */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="mt-2 flex justify-center space-x-4">
                <Link href="https://splunk.softmania.in/#/privacy-policy" target="_blank" className="hover:text-black transition-colors">
                  Privacy Policy
                </Link>
                <Link href="https://splunk.softmania.in/#/terms-and-conditions" target="_blank" className="hover:text-black transition-colors">
                  Terms & Conditions
                </Link>
                <Link href="https://splunk.softmania.in/#/refund-policy" target="_blank" className="hover:text-black transition-colors">
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>

        </div>
      </footer>
      <Salesiq />
    </div>
  )
}
