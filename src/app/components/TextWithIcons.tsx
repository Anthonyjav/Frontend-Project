'use client';

import {
  Truck,
  CreditCard,
  ShieldCheck,
  Headset,
} from 'lucide-react';

type Beneficio = {
  icon: keyof typeof iconMap;
  titulo: string;
  descripcion: string;
};

const iconMap = {
  Truck,
  CreditCard,
  ShieldCheck,
  Headset,
};

const beneficios: Beneficio[] = [
  {
    icon: 'Truck',
    titulo: 'Envíos a todo el país',
    descripcion: 'Recibí tus compras donde estés, rápido y seguro.',
  },
  {
    icon: 'CreditCard',
    titulo: 'Paga en cuotas',
    descripcion: 'Aceptamos todos los métodos de pago.',
  },
  {
    icon: 'ShieldCheck',
    titulo: 'Compra protegida',
    descripcion: 'Tus datos están seguros con nosotros.',
  },
  {
    icon: 'Headset',
    titulo: 'Atención personalizada',
    descripcion: 'Estamos para ayudarte por WhatsApp o mail.',
  },
];

export default function TextWithIcons() {
  return (
    <section className="bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {beneficios.map(({ icon, titulo, descripcion }, idx) => {
            const Icon = iconMap[icon];
            return (
              <div key={idx} className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-full shadow mb-4">
                  <Icon className="w-8 h-8 text-gray-800" />
                </div>
                <h3 className="font-[Montserrat]  text-lg font-semibold mb-2 text-gray-900">{titulo}</h3>
                <p className="font-[Montserrat] text-sm text-gray-600">{descripcion}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
