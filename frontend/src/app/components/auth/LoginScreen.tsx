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
      await fetchData();


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
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-900">Login</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-900">Parol</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
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