'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCalendarAlt, FaFilter, FaBell, FaUsers } from 'react-icons/fa';
import Footer from '@/components/common/Footer';

import PublicHeader from '@/components/common/PublicHeader';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role === 'student') {
          router.push('/student/feed');
        } else if (user.role === 'club') {
          router.push('/club/events');
        } else if (user.role === 'admin') {
          router.push('/admin/pending');
        }
      } catch (error) {
        console.error('Failed to parse user data during auto-redirect:', error);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amrita-bgLight to-white flex flex-col">
      {/* Public Header - Only shows if not redirected (implying guest) */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-amrita-maroon mb-4">
            Amrita Events
          </h1>
          <p className="text-2xl text-amrita-textGray mb-8">
            All Events, One Place
          </p>
          <p className="text-lg text-amrita-textGray mb-12 max-w-2xl mx-auto">
            Never miss another hackathon, workshop, or cultural event. Your centralized platform for
            all campus events at Amrita Vishwa Vidyapeetham, Bengaluru.
          </p>

          <div className="flex justify-center space-x-4">
            <Link href="/register" className="btn-primary px-8 py-3 text-lg">
              Get Started
            </Link>
            <Link href="/login" className="btn-secondary px-8 py-3 text-lg">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-amrita-maroon mb-12">
          Why Amrita Events?
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center">
            <div className="text-4xl text-amrita-maroon mb-4 flex justify-center">
              <FaCalendarAlt />
            </div>
            <h3 className="text-xl font-semibold mb-2">Centralized Events</h3>
            <p className="text-amrita-textGray">
              All campus events in one place. No more missed opportunities.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl text-amrita-maroon mb-4 flex justify-center">
              <FaFilter />
            </div>
            <h3 className="text-xl font-semibold mb-2">Interest-Based Feed</h3>
            <p className="text-amrita-textGray">
              See only events that match your interests. No spam.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl text-amrita-maroon mb-4 flex justify-center">
              <FaBell />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Reminders</h3>
            <p className="text-amrita-textGray">
              Get notified before events. Never miss what matters.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl text-amrita-maroon mb-4 flex justify-center">
              <FaUsers />
            </div>
            <h3 className="text-xl font-semibold mb-2">For Clubs & Students</h3>
            <p className="text-amrita-textGray">
              Easy event creation for clubs. Better discovery for students.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-amrita-maroon text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Feel the Pulse?</h2>
          <p className="text-xl mb-8">
            Join your fellow students at Amrita Bengaluru campus
          </p>
          <Link href="/register" className="btn-secondary px-8 py-3 text-lg">
            Create Your Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
