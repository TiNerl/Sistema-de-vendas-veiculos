import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import ListaUsuariosView from '@/views/ListaUsuariosView.vue'
import CadastrarUsuarioView from '@/views/CadastrarUsuarioView.vue'
import InativarUsuarioView from '@/views/InativarUsuarioView.vue'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requerAutenticacao?: boolean
    apenasAdministrador?: boolean
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
      meta: { requerAutenticacao: true },
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
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const exigeAutenticacao = to.matched.some((route) => route.meta.requerAutenticacao)
  const apenasAdministrador = to.matched.some(
    (route) => route.meta.apenasAdministrador,
  )

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
    return { name: 'dashboard' }
  }

  if (to.meta.publicoSomente && auth.autenticado) {
    return { name: 'dashboard' }
  }

  return true
})

export default router