import { Mail, Phone, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Contact — Traford Farm Fresh',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Get in touch</h1>
      <p className="mt-2 text-traford-muted">
        Questions about an order, products, or partnership? We're happy to help.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <ContactTile
          icon={<Phone className="h-5 w-5" />}
          label="Call us"
          value="+256 700 000 000"
        />
        <ContactTile
          icon={<Mail className="h-5 w-5" />}
          label="Email"
          value="hello@trafordfresh.ug"
        />
        <ContactTile
          icon={<MapPin className="h-5 w-5" />}
          label="Visit"
          value="Kampala, Uganda"
        />
      </div>
    </div>
  );
}

function ContactTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-traford-mint text-traford-green">
        {icon}
      </div>
      <div className="text-xs uppercase tracking-wider text-traford-muted">
        {label}
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
