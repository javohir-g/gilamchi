import { Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useApp } from "../../context/AppContext";
import { toast } from "sonner";

export function LoginScreen() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  const handleGetCode = () => {
    // Open Telegram bot in new tab/window
    // window.open("https://t.me/YOUR_BOT_USERNAME", "_blank");
    setIsCodeSent(true);
    // toast("Telegram botga o'ting va kodni oling", {
    //   duration: 2000,
    // });
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 5) {
      setCode(digits);

      // Auto-verify when 5 digits are entered
      if (digits.length === 5) {
        verifyCode(digits);
      }
    }
  };

  const verifyCode = (enteredCode: string) => {
    // Mock verification - in real app, this would call an API
    // For demo: codes ending in 1 = admin, others = seller
    const isAdmin = enteredCode.endsWith("1");

    const mockUser = {
      id: enteredCode,
      name: isAdmin ? "Abdulatif Abdullayev" : "Aziz Gofurov",
      phone: "+998901234567",
      role: isAdmin ? ("admin" as const) : ("seller" as const),
      branchId: isAdmin ? undefined : "b1",
      branchName: isAdmin ? undefined : "Chilonzor filiali",
    };

    setUser(mockUser);
    // toast.success("Xush kelibsiz!", {
    //   duration: 1000,
    // });

    // Redirect based on role
    const redirectPath = isAdmin
      ? "/admin/dashboard"
      : "/seller/home";
    navigate(redirectPath);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-50 dark:to-blue-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-600">
            <svg
              className="h-12 w-12 text-white dark:text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.94 13.92l-2.994-.924c-.653-.204-.666-.653.136-.973l11.675-4.497c.537-.194 1.006.128.832.977z" />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl text-gray-900 dark:text-gray-900">
            Tizimga kirish
          </h1>
          <p className="text-gray-600 dark:text-gray-600">
            Gilam do'koni boshqaruv tizimi
          </p>
        </div>

        <Card className="p-6 bg-white dark:bg-white border-gray-200 dark:border-gray-200">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-xl text-gray-900 dark:text-gray-900">
                Telegram orqali kirish
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Telegram botdan 5 xonali kodni oling va bu yerga
                kiriting
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleGetCode}
                className="h-14 w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white"
                size="lg"
              >
                <Send className="mr-2 h-5 w-5" />
                Kodni olish
              </Button>

              {isCodeSent && (
                <div className="space-y-3">
                  <div className="h-px bg-gray-200 dark:bg-gray-200"></div>

                  <div className="space-y-2">
                    <label className="block text-center text-sm text-gray-700 dark:text-gray-700">
                      5 xonali kodni kiriting
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) =>
                        handleCodeChange(e.target.value)
                      }
                      placeholder="12345"
                      className="h-16 w-full rounded-lg border-2 border-gray-300 dark:border-gray-300 bg-white dark:bg-white text-gray-900 dark:text-gray-900 text-center text-2xl tracking-widest focus:border-blue-600 dark:focus:border-blue-600 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>

                  <p className="text-center text-xs text-gray-500 dark:text-gray-500">
                    Kod avtomatik tekshiriladi
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="text-center text-sm text-gray-500 dark:text-gray-500">
          <p>Faqat avtorizatsiyalangan foydalanuvchilar</p>
          <p>tizimga kira oladi</p>
        </div>
      </div>
    </div>
  );
}