import { describe, expect, test } from '@rstest/core'
import { render, screen } from '@testing-library/vue'
import { add } from '@/utils/add.js'
import App from '../src/App.vue'

test('renders the main page', () => {
  const testMessage = 'Rsbuild with Vue'
  render(App)
  expect(screen.getByText(testMessage)).toBeInTheDocument()
})

describe('add function', () => {
  test('adds two positive numbers', () => {
    expect(add(2, 3)).toBe(5)
  })

  test('adds positive and negative numbers', () => {
    expect(add(5, -3)).toBe(2)
  })

  test('adds two negative numbers', () => {
    expect(add(-2, -3)).toBe(-5)
  })

  test('adds zero', () => {
    expect(add(0, 10)).toBe(10)
    expect(add(10, 0)).toBe(10)
    expect(add(0, 0)).toBe(0)
  })

  test('handles decimal numbers', () => {
    expect(add(1.5, 2.5)).toBe(4.0)
  })
})
