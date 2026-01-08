import { useState } from "react";
import {
  ArrowLeft,
  User,
  Building,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useApp } from "../../context/AppContext";

export function ManageStaff() {
  const navigate = useNavigate();
  const { staff, branches, updateStaffPermission } = useApp();
  const [selectedBranch, setSelectedBranch] =
    useState<string>("all");

  const filteredStaff =
    selectedBranch === "all"
      ? staff.filter((s) => s.role === "seller")
      : staff.filter(
          (s) =>
            s.role === "seller" &&
            s.branchId === selectedBranch,
        );

  const getBranchName = (branchId?: string) => {
    return (
      branches.find((b) => b.id === branchId)?.name || "N/A"
    );
  };

  const handleTogglePermission = (
    userId: string,
    currentPermission: boolean,
  ) => {
    updateStaffPermission(userId, !currentPermission);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Header */}
      <div className="bg-blue-700 dark:bg-blue-800 px-4 pb-6 pt-6 text-white">
        <div className="mb-4 flex items-center">
          <button
            onClick={() => navigate("/profile")}
            className="mr-3"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl">Xodimlarni boshqarish</h1>
        </div>

        {/* Branch Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={
              selectedBranch === "all" ? "secondary" : "outline"
            }
            size="sm"
            onClick={() => setSelectedBranch("all")}
            className={
              selectedBranch === "all"
                ? ""
                : "bg-blue-600 dark:bg-slate-700 text-white border-blue-500/30 dark:border-slate-600 hover:bg-blue-500 dark:hover:bg-slate-600"
            }
          >
            Hammasi
          </Button>
          {branches.map((branch) => (
            <Button
              key={branch.id}
              variant={
                selectedBranch === branch.id
                  ? "secondary"
                  : "outline"
              }
              size="sm"
              onClick={() => setSelectedBranch(branch.id)}
              className={
                selectedBranch === branch.id
                  ? ""
                  : "bg-blue-600 dark:bg-slate-700 text-white border-blue-500/30 dark:border-slate-600 hover:bg-blue-500 dark:hover:bg-slate-600"
              }
            >
              {branch.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Info Card */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Sotuvchilarga yangi mahsulot qo'shish huquqini
            bering yoki olib tashlang
          </p>
        </Card>

        {/* Staff List */}
        {filteredStaff.length === 0 ? (
          <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              Xodimlar topilmadi
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredStaff.map((member) => (
              <Card
                key={member.id}
                className="p-4 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white">
                        {member.name}
                      </h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Building className="h-3.5 w-3.5 mr-1" />
                        {getBranchName(member.branchId)}
                      </div>
                    </div>
                  </div>

                  {/* <Badge variant={member.canAddProducts ? 'default' : 'secondary'}>
                    {member.canAddProducts ? 'Faol' : 'O\'chirilgan'}
                  </Badge> */}
                </div>

                <div className="flex items-center justify-between border-t dark:border-gray-700 pt-3">
                  <div className="flex items-center text-sm">
                    {member.canAddProducts ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                    )}
                    <span className="text-gray-600 dark:text-gray-300">
                      {member.canAddProducts
                        ? "Ruxsat bor"
                        : "Ruxsat yo'q"}
                    </span>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
                    onClick={() =>
                      handleTogglePermission(
                        member.id,
                        member.canAddProducts || false,
                      )
                    }
                  >
                    O'zgartirish
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}