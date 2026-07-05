import React from "react";
import Title from "./Title";

const Testimonial = () => {
  const benefits = [
    ['Verified fleet', 'Cars are listed with key specs, availability, and transparent daily pricing.'],
    ['Flexible planning', 'Search by city and dates, then refine results with filters and sorting.'],
    ['Trusted flow', 'Bookings, account access, and admin controls stay separated and protected.'],
  ];

  return (
    <section className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Title
          title="Built for confident rentals"
          subTitle="A premium booking experience should feel clear, controlled, and easy to trust."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {benefits.map(([title, copy]) => (
            <div key={title} className="rounded-md border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-6 h-1.5 w-12 rounded-full bg-primary"></div>
              <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
              <p className="mt-3 leading-7 text-slate-500">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
