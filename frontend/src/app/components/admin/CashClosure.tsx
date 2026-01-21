import { useState } from 'react';
import { ArrowLeft, DollarSign, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

export function CashClosure() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { branches, sales } = useApp();

  const branch = branches.find((b) => b.id === branchId);
  const branchSales = sales.filter((s) => s.branchId === branchId);

  const expectedCash = branchSales
    .filter((s) => s.paymentType === 'cash')
    .reduce((sum, s) => sum + s.amount, 0);

  const [receivedCash, setReceivedCash] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  if (!branch) {
    return <div>Filial topilmadi</div>;
  }

  const difference = parseFloat(receivedCash || '0') - expectedCash;

  const handleClose = () => {
    if (!receivedCash) {
      toast.error('Olingan naqd pulni kiriting!');
      return;
    }

    setIsClosed(true);
    toast.success('Kunlik kassa yopildi!');
    
    setTimeout(() => {
      navigate('/admin/dashboard');
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/branch/${branchId}`)}
            disabled={isClosed}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <h1 className="text-xl dark:text-white">Kunlik kassani yopish</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Branch Info */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">Filial</div>
          <div className="text-2xl dark:text-white">{branch.name}</div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('uz-UZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </Card>

        {/* Expected Cash */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="mb-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <DollarSign className="mr-1 h-4 w-4" />
            Kutilayotgan naqd pul
          </div>
          <div className="text-3xl text-blue-600 dark:text-blue-400">
            {formatCurrency(expectedCash)}
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Bugungi naqd to'lovlar yig'indisi
          </div>
        </Card>

        {/* Received Cash Input */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <Label htmlFor="receivedCash" className="mb-4 block text-lg dark:text-white">
            Qabul qilingan naqd pul
          </Label>
          <Input
            id="receivedCash"
            type="number"
            value={receivedCash}
            onChange={(e) => setReceivedCash(e.target.value)}
            placeholder="0"
            className="h-16 text-2xl"
            disabled={isClosed}
          />
        </Card>

        {/* Difference */}
        {receivedCash && (
          <Card
            className={`p-6 ${
              difference === 0
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                : difference > 0
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="mb-2 flex items-center text-sm">
              <AlertCircle className="mr-1 h-4 w-4" />
              <span className={difference === 0 ? 'text-green-700 dark:text-green-400' : difference > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}>
                Farq
              </span>
            </div>
            <div
              className={`text-3xl ${
                difference === 0
                  ? 'text-green-700 dark:text-green-400'
                  : difference > 0
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {difference > 0 ? '+' : ''}
              {formatCurrency(difference)}
            </div>
            <div className="mt-2 text-sm">
              {difference === 0 && (
                <span className="text-green-700 dark:text-green-400">✓ Hisob to'g'ri</span>
              )}
              {difference > 0 && (
                <span className="text-blue-700 dark:text-blue-400">
                  Ortiqcha {formatCurrency(difference)}
                </span>
              )}
              {difference < 0 && (
                <span className="text-red-700 dark:text-red-400">
                  Kam {formatCurrency(Math.abs(difference))}
                </span>
              )}
            </div>
          </Card>
        )}

        {/* Status */}
        {isClosed && (
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 p-6 text-center">
            <Badge className="bg-green-600 text-lg px-4 py-2">
              ✓ Yopildi
            </Badge>
            <div className="mt-4 text-green-700 dark:text-green-400">
              Kunlik kassa muvaffaqiyatli yopildi
            </div>
          </Card>
        )}

        {/* Close Button */}
        {!isClosed && (
          <Button
            onClick={handleClose}
            className="w-full h-14 bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Kunni yopish
          </Button>
        )}
      </div>
    </div>
  );
}