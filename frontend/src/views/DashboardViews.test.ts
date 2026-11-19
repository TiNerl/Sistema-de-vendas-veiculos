import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardView from '@/views/DashboardView.vue'
import VendedorDashboardView from '@/views/VendedorDashboardView.vue'

const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
}

function montarDashboard(component: typeof DashboardView | typeof VendedorDashboardView) {
  return mount(component, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  })
}

describe('atalhos dos dashboards', () => {
  it('apresenta no painel Admin todos os módulos disponíveis ao perfil', () => {
    const wrapper = montarDashboard(DashboardView)
    const links = wrapper.findAll('a.dashboard-shortcut')

    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/admin/veiculos',
      '/admin/clientes',
      '/admin/vendas',
      '/admin/descontos',
      '/admin/relatorios',
      '/admin/usuarios',
    ])
    expect(wrapper.text()).toContain('Relatórios')
    expect(wrapper.findAll('.dashboard-shortcut-icon')).toHaveLength(6)
  })

  it('apresenta relatórios e todas as áreas de vendedor sem atalhos administrativos', () => {
    const wrapper = montarDashboard(VendedorDashboardView)
    const links = wrapper.findAll('a.dashboard-shortcut')

    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/vendedor/clientes',
      '/vendedor/veiculos',
      '/vendedor/vendas',
      '/vendedor/vendas/historico',
      '/vendedor/descontos',
      '/vendedor/relatorios',
    ])
    expect(wrapper.text()).toContain('Relatórios')
    expect(wrapper.findAll('.dashboard-shortcut-icon')).toHaveLength(6)
    expect(links.some((link) => link.attributes('href')?.startsWith('/admin/'))).toBe(false)
  })
})
