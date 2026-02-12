import {
  User,
  Building,
  Building2,
  LogOut,
  Moon,
  Sun,
  Users,
  FileText,
  ChevronDown,
  Check,
  TrendingUp,
  Languages,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";
import { BottomNav } from "./shared/BottomNav";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

import { BranchManagementDialog } from "./admin/BranchManagementDialog";
import { ExchangeRateDialog } from "./admin/ExchangeRateDialog";

export function Profile() {
  const navigate = useNavigate();
  const {
    user,
    setUser,
    branches,
    theme,
    toggleTheme,
    switchToBranchAccount,
    switchBackToAdmin,
    isAdminViewingAsSeller,
    originalAdminUser,
    exchangeRate,
    updateExchangeRate,
  } = useApp();

  const { language, setLanguage, t } = useLanguage();

  const userBranch = branches.find((b) => b.id === user?.branchId);

  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isBranchManagerOpen, setIsBranchManagerOpen] = useState(false);
  const [isExchangeRateOpen, setIsExchangeRateOpen] = useState(false);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);

  // Show account switcher only if user is admin or viewing as seller from admin
  const canSwitchAccounts = originalAdminUser || user?.role === "admin";

  const toggleLanguage = () => {
    const newLang = language === 'uz-latn' ? 'uz-cyrl' : 'uz-latn';
    setLanguage(newLang);
    toast.success(t('messages.languageSwitched'));
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  const handleSwitchToBranch = (branchId: string) => {
    switchToBranchAccount(branchId);
    navigate("/seller/home");
  };

  const handleSwitchBackToAdmin = () => {
    switchBackToAdmin();
    navigate("/admin/dashboard");
  };

  const handleAccountSwitch = (accountType: "admin" | string) => {
    if (accountType === "admin") {
      if (isAdminViewingAsSeller) {
        handleSwitchBackToAdmin();
      }
    } else {
      // It's a branch ID
      handleSwitchToBranch(accountType);
    }
    setIsAccountSwitcherOpen(false);
  };

  // handleUpdateRate logic moved to ExchangeRateDialog

  // Get current account display name
  const getCurrentAccountName = () => {
    if (isAdminViewingAsSeller && originalAdminUser) {
      const branch = branches.find((b) => b.id === user?.branchId);
      return branch ? `${branch.name} (${t('common.seller')})` : user?.name;
    }
    return user?.fullName || user?.name;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-950 px-4 pb-12 pt-6 text-white shadow-lg">
        <h1 className="mb-2 text-2xl">{t('nav.profile')}</h1>
      </div>

      {/* User Info Card */}
      <div className="px-4 -mt-8">
        <Card
          className={`p-6 border border-border bg-card shadow-xl dark:shadow-2xl dark:shadow-blue-900/20 ${canSwitchAccounts ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
            }`}
          onClick={() => canSwitchAccounts && setIsAccountSwitcherOpen(true)}
        >
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 p-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl text-card-foreground">
                  {getCurrentAccountName()}
                </h2>
                {canSwitchAccounts && (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 border">
                  {user?.role === "admin"
                    ? t('common.admin')
                    : t('common.seller')}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Account Switcher Modal */}
      <Dialog open={isAccountSwitcherOpen} onOpenChange={setIsAccountSwitcherOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{t('profile.switchAccount')}</DialogTitle>
            <DialogDescription className="text-center">
              {t('profile.switchAccountDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {/* Admin Account */}
            {(originalAdminUser || user?.role === "admin") && (
              <button
                onClick={() => handleAccountSwitch("admin")}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${!isAdminViewingAsSeller
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-accent"
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 p-3">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-card-foreground">
                      {originalAdminUser?.fullName || originalAdminUser?.name || user?.fullName || user?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('common.admin')}
                    </div>
                  </div>
                </div>
                {!isAdminViewingAsSeller && (
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            )}

            {/* Branch Accounts */}
            {branches.map((branch) => {
              const isCurrentAccount =
                isAdminViewingAsSeller && user?.branchId === branch.id;
              return (
                <button
                  key={branch.id}
                  onClick={() => handleAccountSwitch(branch.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${isCurrentAccount
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-accent"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-gradient-to-br from-green-500 to-green-600 dark:from-green-700 dark:to-green-800 p-3">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-card-foreground">
                        {branch.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('common.seller')}
                      </div>
                    </div>
                  </div>
                  {isCurrentAccount && (
                    <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings */}
      <div className="mt-6 px-4 space-y-3">
        <h3 className="text-sm text-muted-foreground px-1 uppercase">
          {t('nav.settings')}
        </h3>

        <Card className="border border-border bg-card !gap-0">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent border-b dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              {theme === "light" ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-card-foreground">
                {theme === "light"
                  ? t('profile.lightMode')
                  : t('profile.darkMode')}
              </span>
            </div>
          </button>

          <button
            onClick={toggleLanguage}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent border-b dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <span className="text-card-foreground">
                {language === 'uz-latn' ? t('common.latin') : t('common.cyrillic')}
              </span>
            </div>
            <Badge
              variant="secondary"
              className="bg-secondary text-secondary-foreground"
            >
              {language === 'uz-latn' ? t('profile.latin') : t('profile.cyrillic')}
            </Badge>
          </button>

          {user?.role === "admin" && (
            <>
              <button
                onClick={() => setIsBranchManagerOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent border-b dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-card-foreground">
                    {t('profile.manageBranches')}
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate("/admin/manage-staff-members")}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent border-b dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-card-foreground">
                    {t('profile.staffList')}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setIsExchangeRateOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-card-foreground">
                    {t('admin.exchangeRate')}
                  </span>
                </div>
                <Badge variant="outline" className="font-bold text-blue-600 border-blue-200">
                  $1 = {exchangeRate} {t('common.currency')}
                </Badge>
              </button>
            </>
          )}

          {/* Debts button for sellers */}
          {user?.role === "seller" && (
            <button
              onClick={() => navigate("/seller/debts")}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent border-t dark:border-gray-700"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-card-foreground">
                  {t('nav.debts')}
                </span>
              </div>
            </button>
          )}

          {userBranch && (
            <div className="flex w-full items-center justify-between p-4 border-t dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span className="text-card-foreground">
                  {t('admin.branch')}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {userBranch.name}
              </span>
            </div>
          )}
        </Card>

        <Card className="border border-border bg-card">
          <Button
            variant="ghost"
            className="w-full justify-start p-4 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            {t('auth.logout')}
          </Button>
        </Card>
      </div>

      <BranchManagementDialog
        isOpen={isBranchManagerOpen}
        onClose={() => setIsBranchManagerOpen(false)}
      />

      <ExchangeRateDialog
        isOpen={isExchangeRateOpen}
        onClose={() => setIsExchangeRateOpen(false)}
      />

      <BottomNav />
    </div>
  );
}