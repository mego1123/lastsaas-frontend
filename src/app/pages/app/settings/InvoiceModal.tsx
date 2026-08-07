// Import Dependencies
import { useState } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";

// Local Imports
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { billingApi } from "@/utils/api";
import type { FinancialTransaction } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/settings/InvoiceModal.tsx`.
// ----------------------------------------------------------------------

interface InvoiceModalProps {
  tx: FinancialTransaction;
  tenantName: string;
  onClose: () => void;
}

export default function InvoiceModal({
  tx,
  tenantName,
  onClose,
}: InvoiceModalProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await billingApi.getInvoicePDF(tx.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${tx.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Error handled by interceptor
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Transition
      appear
      show
      as={Dialog}
      onClose={onClose}
      className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
    >
      <TransitionChild
        as="div"
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
      />
      <TransitionChild
        as={DialogPanel}
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
      >
        <div className="flex items-center justify-between pb-5">
          <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Invoice
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:text-dark-300 dark:hover:text-dark-50"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Invoice Number
            </span>
            <span className="font-mono text-sm text-gray-900 dark:text-dark-50">
              {tx.invoiceNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Date
            </span>
            <span className="text-sm text-gray-900 dark:text-dark-50">
              {new Date(tx.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Bill To
            </span>
            <span className="text-sm text-gray-900 dark:text-dark-50">
              {tenantName}
            </span>
          </div>
          <hr className="border-gray-200 dark:border-dark-600" />
          <div className="flex justify-between">
            <span className="text-sm text-gray-700 dark:text-dark-200">
              {tx.description}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-dark-50">
              $
              {(
                (tx.taxAmountCents > 0
                  ? tx.subtotalCents || tx.amountCents
                  : tx.amountCents) / 100
              ).toFixed(2)}
            </span>
          </div>
          {tx.taxAmountCents > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-dark-300">
                  Subtotal
                </span>
                <span className="text-sm text-gray-700 dark:text-dark-200">
                  ${((tx.subtotalCents || tx.amountCents) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-dark-300">
                  Tax
                </span>
                <span className="text-sm text-gray-700 dark:text-dark-200">
                  ${(tx.taxAmountCents / 100).toFixed(2)}
                </span>
              </div>
            </>
          )}
          <hr className="border-gray-200 dark:border-dark-600" />
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900 dark:text-dark-50">
              Total
            </span>
            <span className="font-semibold text-gray-900 dark:text-dark-50">
              ${(tx.amountCents / 100).toFixed(2)} {tx.currency.toUpperCase()}
            </span>
          </div>
        </div>

        <Button
          color="primary"
          variant="filled"
          onClick={handleDownload}
          disabled={downloading}
          className="h-10 w-full"
        >
          {downloading ? (
            <Spinner className="h-4 w-4" color="primary" />
          ) : (
            <>
              <Download className="h-4 w-4" /> Download PDF
            </>
          )}
        </Button>
      </TransitionChild>
    </Transition>
  );
}
