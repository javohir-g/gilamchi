import { Smartphone } from 'lucide-react';

export function MobileOnlyScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-white p-6">
            <Smartphone className="h-16 w-16 text-blue-600" />
          </div>
        </div>
        
        <h1 className="mb-4 text-3xl font-bold text-white">
          Mobil qurilma kerak
        </h1>
        
        <p className="mb-6 text-lg text-blue-100">
          Ushbu ilova faqat mobil telefonlar va planshetlar uchun mo'ljallangan.
        </p>
        
        <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-sm text-white">
            Iltimos, mobil qurilmangizdan foydalaning yoki brauzer oynasini kichikroq qiling.
          </p>
        </div>

        <div className="mt-8 text-sm text-blue-200">
          <p>Gilam do'koni boshqaruv tizimi</p>
          <p className="mt-1">Versiya 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
