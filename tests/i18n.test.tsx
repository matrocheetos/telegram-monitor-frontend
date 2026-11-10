import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import { I18nProvider, useI18n, ptBR, enUS } from '../src/lib/i18n'
import { LanguageSwitcher } from '../src/components/layout/LanguageSwitcher'

describe('I18n System', () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = 'lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.documentElement.lang = 'pt-BR'
    Object.defineProperty(window.navigator, 'language', {
      value: 'pt-BR',
      configurable: true,
    })
  })

  it('guarantees key parity between pt-BR and en-US dictionaries', () => {
    function compareKeys(obj1: Record<string, unknown>, obj2: Record<string, unknown>, path = '') {
      const keys1 = Object.keys(obj1).sort()
      const keys2 = Object.keys(obj2).sort()

      expect(keys1).toEqual(keys2)

      for (const key of keys1) {
        const val1 = obj1[key]
        const val2 = obj2[key]
        const currentPath = path ? `${path}.${key}` : key

        expect(typeof val1).toBe(typeof val2)

        if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
          compareKeys(val1 as Record<string, unknown>, val2 as Record<string, unknown>, currentPath)
        }
      }
    }

    compareKeys(ptBR as unknown as Record<string, unknown>, enUS as unknown as Record<string, unknown>)
  })

  it('provides default pt-BR locale and supports instant switching', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider initialLocale="pt-BR">{children}</I18nProvider>
    )

    const { result } = renderHook(() => useI18n(), { wrapper })

    expect(result.current.locale).toBe('pt-BR')
    expect(result.current.t.common.appName).toBe('TELEGRAM MONITOR')
    expect(result.current.t.login.submit).toBe('Login')
    expect(document.documentElement.lang).toBe('pt-BR')

    act(() => {
      result.current.setLocale('en-US')
    })

    expect(result.current.locale).toBe('en-US')
    expect(result.current.t.common.logout).toBe('Log Out')
    expect(localStorage.getItem('lang')).toBe('en-US')
    expect(document.cookie).toContain('lang=en-US')
    expect(document.documentElement.lang).toBe('en-US')
  })

  it('detects initial language from localStorage when available', () => {
    localStorage.setItem('lang', 'en-US')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    )

    const { result } = renderHook(() => useI18n(), { wrapper })

    expect(result.current.locale).toBe('en-US')
    expect(result.current.t.common.logout).toBe('Log Out')
  })

  it('detects initial language from cookie when available', () => {
    document.cookie = 'lang=en-US; path=/;'

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    )

    const { result } = renderHook(() => useI18n(), { wrapper })

    expect(result.current.locale).toBe('en-US')
  })

  it('renders LanguageSwitcher in dark variant and switches language on click', () => {
    render(
      <I18nProvider initialLocale="pt-BR">
        <LanguageSwitcher variant="dark" />
      </I18nProvider>,
    )

    const ptButton = screen.getByRole('button', { name: 'PT' })
    const enButton = screen.getByRole('button', { name: 'EN' })

    expect(ptButton).toHaveClass('text-sky-400', 'font-bold')
    expect(enButton).toHaveClass('text-slate-400', 'font-normal')

    fireEvent.click(enButton)

    expect(enButton).toHaveClass('text-sky-400', 'font-bold')
    expect(ptButton).toHaveClass('text-slate-400', 'font-normal')
    expect(localStorage.getItem('lang')).toBe('en-US')
  })

  it('renders LanguageSwitcher in light variant and switches language on click', () => {
    render(
      <I18nProvider initialLocale="pt-BR">
        <LanguageSwitcher variant="light" />
      </I18nProvider>,
    )

    const ptButton = screen.getByRole('button', { name: 'PT' })
    const enButton = screen.getByRole('button', { name: 'EN' })

    expect(ptButton).toHaveClass('text-blue-600', 'font-bold')
    expect(enButton).toHaveClass('text-slate-500', 'font-normal')

    fireEvent.click(enButton)

    expect(enButton).toHaveClass('text-blue-600', 'font-bold')
    expect(ptButton).toHaveClass('text-slate-500', 'font-normal')
    expect(localStorage.getItem('lang')).toBe('en-US')
  })
})
