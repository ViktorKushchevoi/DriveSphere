import React from 'react';

const Newsletter = () => {
  return (
    <section className="px-5 pb-24 md:px-8">
      <div className="mx-auto max-w-7xl rounded-md bg-light p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Customer trust</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Plan your next drive with less friction.</h2>
            <p className="mt-3 max-w-2xl text-slate-500">Browse cars, compare the essentials, and keep your booking history organized from your account.</p>
          </div>
          <a href="/cars" className="w-max rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dull">
            Browse cars
          </a>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
