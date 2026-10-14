import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mostra o formulário de acesso administrativo', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Entrar como administrador')
    expect(wrapper.find('input[name="cpf"]').exists()).toBe(true)
    expect(wrapper.find('input[name="senha"]').exists()).toBe(true)
  })
})
