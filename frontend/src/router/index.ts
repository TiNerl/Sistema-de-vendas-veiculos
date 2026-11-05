import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import ListaUsuariosView from '@/views/ListaUsuariosView.vue'
import CadastrarUsuarioView from '@/views/CadastrarUsuarioView.vue'
import InativarUsuarioView from '@/views/InativarUsuarioView.vue'
import VendLayout from '@/layouts/VendLayout.vue'
import VendedorDashboardView from '@/views/VendedorDashboardView.vue'
import ModuloVendedorView from '@/views/ModuloVendedorView.vue'
import VeiculosVendedorView from '@/views/VeiculosVendedorView.vue'
import ClientesView from '@/views/ClientesView.vue'
import CadastrarClienteView from '@/views/CadastrarClienteView.vue'
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
          path: 'vendas',
          name: 'vendedor-vendas',
          component: ModuloVendedorView,
          meta: { titulo: 'Vendas' },
        },
        {
          path: 'test-drives',
          name: 'vendedor-test-drives',
          component: ModuloVendedorView,
          meta: { titulo: 'Test drives' },
        },
        {
          path: 'relatorios',
          name: 'vendedor-relatorios',
          component: ModuloVendedorView,
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