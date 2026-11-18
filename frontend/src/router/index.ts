import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import ListaUsuariosView from '@/views/ListaUsuariosView.vue'
import CadastrarUsuarioView from '@/views/CadastrarUsuarioView.vue'
import InativarUsuarioView from '@/views/InativarUsuarioView.vue'
import VendLayout from '@/layouts/VendLayout.vue'
import VendedorDashboardView from '@/views/VendedorDashboardView.vue'
import VeiculosVendedorView from '@/views/VeiculosVendedorView.vue'
import ClientesView from '@/views/ClientesView.vue'
import CadastrarClienteView from '@/views/CadastrarClienteView.vue'
import CadastrarVeiculoView from '@/views/CadastrarVeiculoView.vue'
import CadastrarVendaView from '@/views/CadastrarVendaView.vue'
import HistoricoVendasView from '@/views/HistoricoVendasView.vue'
import SolicitacoesDescontoView from '@/views/SolicitacoesDescontoView.vue'
import RelatoriosView from '@/views/RelatoriosView.vue'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requerAutenticacao?: boolean
    apenasAdministrador?: boolean
    apenasVendedor?: boolean
    publicoSomente?: boolean
    titulo?: string
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      meta: { publicoSomente: true, titulo: 'Entrar' },
    },
    {
      path: '/',
      component: AdminLayout,
      meta: { requerAutenticacao: true, apenasAdministrador: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { titulo: 'Início' },
        },
        {
          path: 'admin/usuarios',
          name: 'lista-usuarios',
          component: ListaUsuariosView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Usuários',
          },
        },
        {
          path: 'admin/clientes',
          name: 'admin-clientes',
          component: ClientesView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Clientes',
          },
        },
        {
          path: 'admin/veiculos',
          name: 'admin-veiculos',
          component: VeiculosVendedorView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Estoque de Veículos',
          },
        },
        {
          path: 'admin/veiculos/cadastrar',
          name: 'admin-cadastrar-veiculo',
          component: CadastrarVeiculoView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Cadastrar Veículo',
          },
        },
        {
          path: 'admin/veiculos/:id/editar',
          name: 'admin-editar-veiculo',
          component: CadastrarVeiculoView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Editar Veículo',
          },
        },
        {
          path: 'admin/clientes/cadastrar',
          name: 'admin-cadastrar-cliente',
          component: CadastrarClienteView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Cadastrar cliente',
          },
        },
        {
          path: 'admin/clientes/:id/editar',
          name: 'admin-editar-cliente',
          component: CadastrarClienteView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Editar cliente',
          },
        },
        {
          path: 'admin/usuarios/cadastrar',
          name: 'cadastrar-usuario',
          component: CadastrarUsuarioView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Cadastrar usuário',
          },
        },
        {
          path: 'admin/usuarios/inativar',
          name: 'inativar-usuario',
          component: InativarUsuarioView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Inativar usuário',
          },
        },
        {
          path: 'admin/vendas',
          name: 'admin-historico-vendas',
          component: HistoricoVendasView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Histórico de Vendas',
          },
        },
        {
          path: 'admin/vendas/cadastrar',
          name: 'admin-cadastrar-venda',
          component: CadastrarVendaView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Registrar venda',
          },
        },
        {
          path: 'admin/descontos',
          name: 'admin-solicitacoes-desconto',
          component: SolicitacoesDescontoView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Aprovação de descontos',
          },
        },
        {
          path: 'admin/relatorios',
          name: 'admin-relatorios',
          component: RelatoriosView,
          meta: {
            requerAutenticacao: true,
            apenasAdministrador: true,
            titulo: 'Relatórios',
          },
        },
      ],
    },
    {
      path: '/vendedor',
      component: VendLayout,
      meta: { requerAutenticacao: true, apenasVendedor: true },
      children: [
        {
          path: '',
          name: 'vendedor-inicio',
          component: VendedorDashboardView,
          meta: { titulo: 'Início' },
        },
        {
          path: 'clientes',
          name: 'vendedor-clientes',
          component: ClientesView,
          meta: { titulo: 'Clientes' },
        },
        {
          path: 'clientes/cadastrar',
          name: 'vendedor-cadastrar-cliente',
          component: CadastrarClienteView,
          meta: { titulo: 'Cadastrar cliente' },
        },
        {
          path: 'clientes/:id/editar',
          name: 'vendedor-editar-cliente',
          component: CadastrarClienteView,
          meta: { titulo: 'Editar cliente' },
        },
        {
          path: 'veiculos',
          name: 'vendedor-veiculos',
          component: VeiculosVendedorView,
          meta: { titulo: 'Estoque de Veículos' },
        },
        {
          path: 'veiculos/cadastrar',
          name: 'vendedor-cadastrar-veiculo',
          component: CadastrarVeiculoView,
          meta: { titulo: 'Cadastrar Veículo' },
        },
        {
          path: 'veiculos/:id/editar',
          name: 'vendedor-editar-veiculo',
          component: CadastrarVeiculoView,
          meta: { titulo: 'Editar Veículo' },
        },
        {
          path: 'vendas',
          name: 'vendedor-vendas',
          component: CadastrarVendaView,
          meta: { titulo: 'Registrar venda' },
        },
        {
          path: 'vendas/historico',
          name: 'vendedor-historico-vendas',
          component: HistoricoVendasView,
          meta: { titulo: 'Histórico de Vendas' },
        },
        {
          path: 'descontos',
          name: 'vendedor-solicitacoes-desconto',
          component: SolicitacoesDescontoView,
          meta: { titulo: 'Minhas solicitações' },
        },
        {
          path: 'relatorios',
          name: 'vendedor-relatorios',
          component: RelatoriosView,
          meta: { titulo: 'Relatórios' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const exigeAutenticacao = to.matched.some((route) => route.meta.requerAutenticacao)
  const apenasAdministrador = to.matched.some(
    (route) => route.meta.apenasAdministrador,
  )
  const apenasVendedor = to.matched.some((route) => route.meta.apenasVendedor)

  if (auth.token && !auth.usuario) {
    try {
      await auth.carregarPerfil()
    } catch {
      auth.sair()
    }
  }

  if (exigeAutenticacao && !auth.autenticado) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (apenasAdministrador && auth.usuario?.perfil !== 'admin') {
    return auth.usuario?.perfil === 'vendedor'
      ? { name: 'vendedor-inicio' }
      : { name: 'login' }
  }

  if (apenasVendedor && auth.usuario?.perfil !== 'vendedor') {
    return auth.usuario?.perfil === 'admin'
      ? { name: 'dashboard' }
      : { name: 'login' }
  }

  if (to.name === 'admin-veiculos' && auth.usuario?.perfil !== 'admin') {
    return auth.usuario?.perfil === 'vendedor'
      ? { name: 'vendedor-veiculos' }
      : { name: 'login' }
  }

  if (to.meta.publicoSomente && auth.autenticado) {
    return auth.usuario?.perfil === 'vendedor'
      ? { name: 'vendedor-inicio' }
      : { name: 'dashboard' }
  }

  return true
})

export default router