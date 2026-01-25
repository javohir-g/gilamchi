import { useState } from "react";
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useApp } from "../../context/AppContext";
import { authService } from "../../../services/api";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function LoginScreen() {
  const navigate = useNavigate();
  const { setUser, fetchData } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const data = await authService.login(formData);

      // Store token
      localStorage.setItem('token', data.access_token);

      // Get user details
      const user = await authService.getMe();
      setUser(user);
      setUser(user);
      fetchData(); // Don't await - load data in background


      toast.success(`Xush kelibsiz, ${user.name}!`);

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/seller/home');
      }
    } catch (error) {
      console.error("Login failed", error);
      const msg = (error as any).response?.data?.detail || "Login yoki parol noto'g'ri.";
      toast.error(`Kirishda xatolik! ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white to-gray-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-white shadow-xl border border-gray-100 p-2">
            <img
              src="/icons/login-logo.png"
              alt="Gilamchi Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mb-2 text-4xl font-bold text-[#1F3F8C]">
            Gilamchi
          </h1>
          <p className="text-gray-500 font-medium tracking-wide">
            Boshqaruv tizimiga xush kelibsiz
          </p>
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur-sm border-gray-200 shadow-2xl rounded-3xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold ml-1">Login</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Loginni kiriting"
                className="h-12 bg-gray-50 border-gray-200 focus:ring-[#1F3F8C] rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold ml-1">Parol</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="h-12 bg-gray-50 border-gray-200 focus:ring-[#1F3F8C] rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#1F3F8C] hover:bg-[#152b61] text-white text-lg font-bold rounded-2xl shadow-lg shadow-[#1F3F8C]/20 transition-all active:scale-95"
              size="lg"
            >
              {loading ? "Kirish..." : "Kirish"}
            </Button>
          </form>
        </Card>

        <div className="text-center text-sm text-gray-500 dark:text-gray-500">
          <p>Faqat avtorizatsiyalangan foydalanuvchilar</p>
          <p>tizimga kira oladi</p>
        </div>
      </div>
    </div>
  );
}