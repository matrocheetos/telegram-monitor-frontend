import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  adminQueries,
  useTelegramSendCodeMutation,
  useTelegramVerifyMutation,
  useTelegramDisconnectMutation,
} from '../../../lib/api/queries'
import { PageHeader } from '../../../components/layout/PageHeader'
import { useI18n } from '../../../lib/i18n'
import { ApiError } from '../../../lib/api/client'

export const Route = createFileRoute('/_authenticated/_admin/admin/telegram')({
  component: AdminTelegramPage,
})

function AdminTelegramPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: status, error: statusError } = useQuery(adminQueries.telegram())

  const sendCodeMutation = useTelegramSendCodeMutation()
  const verifyMutation = useTelegramVerifyMutation()
  const disconnectMutation = useTelegramDisconnectMutation()

  // Step 1 state
  const [apiId, setApiId] = useState('')
  const [apiHash, setApiHash] = useState('')
  const [phone, setPhone] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  // Step 2 state
  const [otpCode, setOtpCode] = useState('')
  const [password2FA, setPassword2FA] = useState('')
  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [step2Error, setStep2Error] = useState<string | null>(null)

  const isConnected = status?.connected === true

  const handleSendCode = (e: FormEvent) => {
    e.preventDefault()
    setStep1Error(null)

    const parsedApiId = parseInt(apiId.trim(), 10)
    if (isNaN(parsedApiId) || parsedApiId <= 0) {
      setStep1Error(t.apiErrors.unprocessable)
      return
    }

    sendCodeMutation.mutate(
      {
        apiId: parsedApiId,
        apiHash: apiHash.trim(),
        phone: phone.trim(),
      },
      {
        onSuccess: () => {
          setCodeSent(true)
        },
        onError: (err) => {
          setStep1Error(err instanceof ApiError ? err.message : t.apiErrors.genericError)
        },
      },
    )
  }

  const handleVerify = (e: FormEvent) => {
    e.preventDefault()
    setStep2Error(null)

    verifyMutation.mutate(
      {
        phoneCode: otpCode.trim(),
        password2FA: password2FA.trim(),
      },
      {
        onSuccess: () => {
          navigate({ to: '/admin/channels' })
        },
        onError: (err) => {
          setStep2Error(err instanceof ApiError ? err.message : t.apiErrors.genericError)
        },
      },
    )
  }

  const handleDisconnect = () => {
    if (window.confirm(t.telegram.disconnectConfirm)) {
      disconnectMutation.mutate()
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader title={t.telegram.title} />

      {statusError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
          {statusError instanceof ApiError ? statusError.message : t.apiErrors.genericError}
        </div>
      )}

      {/* Session Status Banner (Board 4 Connected vs Board 4b Disconnected) */}
      {isConnected ? (
        <div className="bg-white border-2 border-emerald-300 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider select-none mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.telegram.activeSession}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight tabular-nums">
              {t.telegram.connectedAccount(status.phoneMasked)}
            </h2>
            <span className="text-xs sm:text-sm text-slate-600 mt-0.5 tabular-nums">
              {t.telegram.syncedChannels(status.channelsCount)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate({ to: '/admin/channels' })}
              className="h-11 sm:h-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer select-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1"
            >
              {t.telegram.selectChannels}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="h-11 sm:h-auto px-4 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 select-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
            >
              {disconnectMutation.isPending ? '…' : t.telegram.disconnect}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/50 border-2 border-amber-300 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider select-none mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {t.telegram.inactiveSession}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {t.telegram.noAccountConnected}
            </h2>
            <span className="text-xs sm:text-sm text-slate-600 mt-0.5 tabular-nums">
              {t.telegram.syncedChannels(0)}
            </span>
          </div>

          <span className="inline-flex items-center justify-center px-3 py-2 bg-amber-100 border border-amber-300 rounded-lg text-xs font-semibold text-amber-800 select-none">
            {t.telegram.pendingAuth}
          </span>
        </div>
      )}

      {/* 2-Step MTProto Connection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Step 1: Request OTP Code */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase">
                {t.telegram.step1}
              </span>
              <h3 className="text-base font-bold text-slate-900 select-none">
                {t.telegram.step1Title}
              </h3>
            </div>

            {step1Error && (
              <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600">
                {step1Error}
              </div>
            )}

            <form id="step1-form" onSubmit={handleSendCode} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tg-api-id" className="text-xs font-semibold text-slate-700">
                  {t.telegram.apiId}
                </label>
                <input
                  id="tg-api-id"
                  name="apiId"
                  type="text"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  placeholder={t.telegram.apiIdPlaceholder}
                  required
                  disabled={sendCodeMutation.isPending}
                  inputMode="numeric"
                  spellCheck={false}
                  autoComplete="off"
                  className="h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tg-api-hash" className="text-xs font-semibold text-slate-700">
                  {t.telegram.apiHash}
                </label>
                <input
                  id="tg-api-hash"
                  name="apiHash"
                  type="text"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  placeholder={t.telegram.apiHashPlaceholder}
                  required
                  disabled={sendCodeMutation.isPending}
                  spellCheck={false}
                  autoComplete="off"
                  className="h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tg-phone" className="text-xs font-semibold text-slate-700">
                  {t.telegram.phone}
                </label>
                <input
                  id="tg-phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.telegram.phonePlaceholder}
                  required
                  disabled={sendCodeMutation.isPending}
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
                />
              </div>
            </form>
          </div>

          <div className="pt-6">
            <button
              form="step1-form"
              type="submit"
              disabled={sendCodeMutation.isPending}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {sendCodeMutation.isPending ? '…' : t.telegram.sendOtp}
            </button>
          </div>
        </div>

        {/* Step 2: Verify Code and Save Session */}
        <div
          className={`bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between transition-opacity ${
            !codeSent ? 'opacity-60' : 'opacity-100'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase">
                {t.telegram.step2}
              </span>
              <h3 className="text-base font-bold text-slate-900 select-none">
                {t.telegram.step2Title}
              </h3>
            </div>

            {step2Error && (
              <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600">
                {step2Error}
              </div>
            )}

            <form id="step2-form" onSubmit={handleVerify} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tg-otp" className="text-xs font-semibold text-slate-700">
                  {t.telegram.code}
                </label>
                <input
                  id="tg-otp"
                  name="code"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder={codeSent ? '12345' : t.telegram.codeDisabledPlaceholder}
                  required
                  disabled={!codeSent || verifyMutation.isPending}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  spellCheck={false}
                  className="h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 transition-colors disabled:bg-slate-100 tabular-nums"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tg-2fa" className="text-xs font-semibold text-slate-700">
                  {t.telegram.twoFactor}{' '}
                  <span className="font-normal text-slate-400">{t.telegram.twoFactorOptional}</span>
                </label>
                <input
                  id="tg-2fa"
                  name="twoFactor"
                  type="password"
                  value={password2FA}
                  onChange={(e) => setPassword2FA(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={!codeSent || verifyMutation.isPending}
                  autoComplete="current-password"
                  className="h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 transition-colors disabled:bg-slate-100"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="block text-xs font-bold text-slate-800">
                  {t.telegram.securityNoticeTitle}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  {t.telegram.securityNoticeDesc}
                </span>
              </div>
            </form>
          </div>

          <div className="pt-6">
            <button
              form="step2-form"
              type="submit"
              disabled={!codeSent || verifyMutation.isPending}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {verifyMutation.isPending ? '…' : t.telegram.connectAccount}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
