import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Zap,
  Users,
  Database,
  FileText,
  DollarSign,
  CheckCircle,
  Search,
  Bell,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Lock,
  Globe
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50); // Increased threshold for sleeker effect
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Proposals', path: '/proposals' },
    { name: 'About', path: '#about' },
    { name: 'Features', path: '#features' },
    { name: 'Docs', path: '#docs' }, // Shortened Documentation
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-white/90 backdrop-blur-md shadow-xl border-b border-purple-100'
        : 'bg-transparent pt-2' // Slight padding adjustment for sleeker initial look
        }`}
    >
      <div className="max-w-8xl mx-auto px-6 lg:px-12"> {/* Increased max-width slightly for desktop nav */}
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-black">D</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-extrabold text-gray-900">
                DKG Governance
              </span>
              <p className="text-xs text-gray-500 -mt-0.5">Polkadot OpenGov</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className={`text-sm font-medium transition-colors relative 
                  ${isScrolled ? 'text-gray-700 hover:text-purple-600' : 'text-gray-900 hover:text-purple-600'}
                  group`}
              >
                {link.name}
                <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-purple-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/proposals"
              className="px-6 py-2.5 text-sm font-bold text-black bg-gradient-to-r from-pink-600 to-purple-600 rounded-full hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5"
            >
              Explore Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-2xl">
            <div className="px-6 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.path}
                  className="block text-base font-medium text-gray-700 hover:text-purple-600 transition-colors py-2 border-b border-gray-100 last:border-b-0"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Link
                to="/proposals"
                className="block w-full text-center mt-4 px-6 py-3 text-sm font-semibold text-black bg-gradient-to-r from-pink-600 to-purple-600 rounded-full hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Explore Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
export default function LandingPage() {
  return (
    <>
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -right-40 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 w-full  mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-5 py-2.5 text-sm font-medium text-purple-700 mb-8 shadow-lg border border-purple-200/50 hover:border-purple-300 transition-colors">
              <Sparkles className="w-4 h-4" />
              <span>Powered by OriginTrail DKG v6</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-gray-900 mb-8 leading-[1.1]">
              Decentralized Knowledge<br />
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-black">
                Meets Governance
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-gray-600 mb-12 leading-relaxed font-light">
              Transform Polkadot OpenGov proposals into verifiable, immutable knowledge assets on the world's first decentralized knowledge graph.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/proposals"
                className="group px-8 py-4 text-lg font-bold text-black bg-gradient-to-r from-pink-600 to-purple-600 rounded-full hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-pink-500/40 transform hover:-translate-y-1 flex items-center gap-2"
              >
                Explore Proposals
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#about"
                className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white/90 backdrop-blur-lg border-2 border-gray-200 rounded-full hover:border-purple-400 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Learn More
              </a>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { number: "1,000+", label: "Proposals Tracked", icon: FileText },
                { number: "100%", label: "Decentralized", icon: Globe },
                { number: "AI", label: "Verified", icon: CheckCircle },
                { number: "DKG v6", label: "Powered", icon: Database },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className="group bg-white/95 backdrop-blur-xl rounded-2xl p-6 text-center border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-black" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-black">
                    {stat.number}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-gray-400 rotate-90" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 lg:py-32 bg-white">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              ABOUT THE PLATFORM
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
              What is{' '}
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-black">
                DKG Governance
              </span>
              ?
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
              A revolutionary platform bridging blockchain governance with decentralized knowledge infrastructure.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Features */}
            <div className="space-y-8">
              {[
                {
                  icon: Shield,
                  title: "Transparent Governance",
                  desc: "Every proposal is tracked, verified, and published as a permanent knowledge asset on the DKG — creating an immutable record of governance history.",
                  color: "pink"
                },
                {
                  icon: Users,
                  title: "Community-Driven Insights",
                  desc: "Stakeholders submit expert reports. AI ensures quality while premium content enables analysts to monetize their deep insights securely.",
                  color: "purple"
                },
                {
                  icon: Lock,
                  title: "Cryptographically Secure",
                  desc: "Built on OriginTrail's battle-tested DKG infrastructure with cryptographic verification for every knowledge asset.",
                  color: "pink"
                }
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className="group flex gap-6 p-6 rounded-2xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50/30 transition-all duration-300"
                >
                  <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${item.color === 'pink' ? 'from-pink-500 to-purple-600' : 'from-purple-500 to-pink-600'
                    } rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-7 h-7 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column - Visual Card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-pink-600 rounded-3xl p-1 shadow-2xl">
                <div className="bg-white rounded-[22px] p-8 lg:p-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-semibold text-gray-600">LIVE ON MAINNET</span>
                    </div>

                    <h3 className="text-3xl font-bold text-gray-900 mb-6">
                      How It Works
                    </h3>

                    <div className="space-y-4">
                      {[
                        { step: "01", text: "Proposals fetched from Polkadot OpenGov" },
                        { step: "02", text: "Published to OriginTrail DKG as knowledge assets" },
                        { step: "03", text: "Community adds verified reports & insights" },
                        { step: "04", text: "Premium content monetized via X402 payments" }
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-4 group">
                          <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center font-bold text-purple-700 text-sm group-hover:scale-110 transition-transform">
                            {item.step}
                          </span>
                          <p className="text-gray-700 leading-relaxed pt-1.5">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold mb-4">
              POWERFUL FEATURES
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
              Everything You Need
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-600">
              Built for transparency, verifiability, and collaboration
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: "Knowledge Assets",
                desc: "Publish proposals as verifiable, permanent assets on the DKG with cryptographic proof.",
                gradient: "from-pink-500 to-purple-600"
              },
              {
                icon: FileText,
                title: "Community Reports",
                desc: "Submit in-depth analysis with AI-powered quality verification and peer review.",
                gradient: "from-purple-500 to-pink-600"
              },
              {
                icon: DollarSign,
                title: "Premium Insights",
                desc: "Monetize expert research via X402 micropayments on Base blockchain.",
                gradient: "from-pink-600 to-purple-500"
              },
              {
                icon: CheckCircle,
                title: "AI Verification",
                desc: "Automated quality control ensures reliable, accurate content from all contributors.",
                gradient: "from-purple-600 to-pink-500"
              },
              {
                icon: Search,
                title: "Advanced Search",
                desc: "Instant filtering by status, track, treasury amount, or keywords for precise discovery.",
                gradient: "from-pink-500 to-purple-600"
              },
              {
                icon: TrendingUp,
                title: "Analytics Dashboard",
                desc: "Real-time insights into proposal trends, voting patterns, and community engagement.",
                gradient: "from-purple-500 to-pink-600"
              }
            ].map((feature, idx) => (
              <div
                key={feature.title}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-purple-200 hover:-translate-y-2"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-black" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-black text-black">D</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-black">DKG Governance</span>
                  <p className="text-xs text-gray-500">Powered by OriginTrail</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md mb-6">
                Transforming Polkadot governance through decentralized, verifiable knowledge. Built for the community, powered by cutting-edge technology.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 transition-all">
                  <span className="text-black font-bold">𝕏</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 transition-all">
                  <Globe className="w-5 h-5 text-black" />
                </a>
              </div>
            </div>

            {/* Navigation Column */}
            <div>
              <h3 className="text-black font-bold text-base mb-4 uppercase tracking-wider">Platform</h3>
              <ul className="space-y-3">
                <li><Link to="/proposals" className="hover:text-pink-400 transition text-sm">Proposals</Link></li>
                <li><a href="#about" className="hover:text-pink-400 transition text-sm">About</a></li>
                <li><a href="#features" className="hover:text-pink-400 transition text-sm">Features</a></li>
                <li><a href="#docs" className="hover:text-pink-400 transition text-sm">Documentation</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-black font-bold text-base mb-4 uppercase tracking-wider">Resources</h3>
              <ul className="space-y-3">
                <li><a href="https://polkadot.network" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition text-sm">Polkadot Network</a></li>
                <li><a href="https://origintrail.io" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition text-sm">OriginTrail</a></li>
                <li><a href="https://dkg.origintrail.io" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition text-sm">DKG Explorer</a></li>
                <li><a href="#" className="hover:text-pink-400 transition text-sm">GitHub</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} DKG Governance. Built with decentralization in mind.
              </p>
              <div className="flex gap-6 text-sm">
                <a href="#" className="text-gray-500 hover:text-pink-400 transition">Privacy Policy</a>
                <a href="#" className="text-gray-500 hover:text-pink-400 transition">Terms of Service</a>
                <a href="#" className="text-gray-500 hover:text-pink-400 transition">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}