import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useApp } from '../../context/AppContext';

export function OTPScreen() {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(120);
  const navigate = useNavigate();
  const { setUser } = useApp();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  const handleVerify = () => {
    // Mock verification - 11111 for admin, 22222 for seller
    if (otp === '11111') {
      setUser({
        id: 'u1',
        name: 'Admin',
        role: 'admin',
      });
      navigate('/admin/dashboard');
    } else if (otp === '22222') {
      setUser({
        id: 'u2',
        name: 'Sotuvchi',
        role: 'seller',
        branchId: 'b1',
      });
      navigate('/seller/home');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl">Kodni kiriting</h1>
          <p className="text-gray-600">Telegram bot orqali yuborilgan 5 xonali kod</p>
        </div>

        <Card className="p-8">
          <div className="space-y-8">
            <div className="flex justify-center">
              <InputOTP maxLength={5} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-3">
                  <InputOTPSlot index={0} className="h-16 w-16 text-2xl" />
                  <InputOTPSlot index={1} className="h-16 w-16 text-2xl" />
                  <InputOTPSlot index={2} className="h-16 w-16 text-2xl" />
                  <InputOTPSlot index={3} className="h-16 w-16 text-2xl" />
                  <InputOTPSlot index={4} className="h-16 w-16 text-2xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-2 text-2xl tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <p className="text-sm text-gray-500">
                  Kod Telegram bot orqali yuborildi
                </p>
              </div>

              <Button
                onClick={handleVerify}
                disabled={otp.length !== 5}
                className="h-14 w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Tasdiqlash
              </Button>
            </div>
          </div>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Demo: 11111 - Admin | 22222 - Sotuvchi</p>
        </div>
      </div>
    </div>
  );
}
