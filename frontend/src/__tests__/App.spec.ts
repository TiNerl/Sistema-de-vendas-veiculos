import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import LoginView from '../views/LoginView.vue'

describe('LoginView', () => {
  it('renders the AutoSaller sign-in form', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: LoginView }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(LoginView, {
      global: { plugins: [createPinia(), router] },
    })

    expect(wrapper.text()).toContain('AutoSaller')
    expect(wrapper.text()).toContain('Gestão inteligente para sua concessionária')
    expect(wrapper.get('input#login-cpf').attributes('autocomplete')).toBe('username')
    expect(wrapper.get('input#login-senha').attributes('type')).toBe('password')
  })
})
