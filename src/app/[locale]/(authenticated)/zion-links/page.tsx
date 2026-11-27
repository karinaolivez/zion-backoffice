'use client';

import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabItem } from '@/components/ui/tabs';
import BarChart from '@/components/ui/bar-chart';
import {
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Activity
} from 'lucide-react';

export default function ZionLinksPage() {
  // Dados para os cards de estatísticas
  const statsData = [
    { label: 'Líderes Cadastrados', value: '350', change: '+12%', icon: Users, color: 'blue' },
    { label: 'Participantes', value: '110', change: '+8%', icon: UserPlus, color: 'emerald' },
    { label: 'Links Criados', value: '6', change: '+2%', icon: TrendingUp, color: 'purple' },
    { label: 'Links Ativos', value: '40', change: '+15%', icon: Activity, color: 'orange' },
    { label: 'Eventos', value: '25', change: '+5%', icon: Calendar, color: 'pink' },
    { label: 'Crescimento', value: '18%', change: '+3%', icon: BarChart3, color: 'yellow' }
  ];

  // Dados dos líderes
  const leaderData = [
    {
      id: 1,
      name: 'FERNANDO PEDRO LEAL',
      email: 'fernando@email.com',
      status: 'Ativo',
      points: '1250',
      position: 'Líder',
      ranking: 'Sim',
      baptism: 'Sim'
    },
    {
      id: 2,
      name: 'MARIA SILVA SANTOS',
      email: 'maria@email.com',
      status: 'Ativo',
      points: '980',
      position: 'Auxiliar',
      ranking: 'Sim',
      baptism: 'Não'
    },
    {
      id: 3,
      name: 'JOÃO CARLOS OLIVEIRA',
      email: 'joao@email.com',
      status: 'Inativo',
      points: '750',
      position: 'Coordenador',
      ranking: 'Não',
      baptism: 'Sim'
    }
  ];

  // Dados dos participantes
  const participantData = [
    {
      id: 1,
      name: 'ANA PAULA COSTA',
      email: 'ana@email.com',
      phone: '(11) 99999-9999',
      leader: 'Fernando Pedro',
      status: 'Ativo',
      date: '15/01/2024'
    },
    {
      id: 2,
      name: 'CARLOS EDUARDO LIMA',
      email: 'carlos@email.com',
      phone: '(11) 88888-8888',
      leader: 'Maria Silva',
      status: 'Ativo',
      date: '20/01/2024'
    },
    {
      id: 3,
      name: 'PATRICIA ALVES ROCHA',
      email: 'patricia@email.com',
      phone: '(11) 77777-7777',
      leader: 'João Carlos',
      status: 'Pendente',
      date: '25/01/2024'
    }
  ];

  // Dados para a aba de gráficos
  const chartStatsData = [
    { label: 'Líderes Cadastrados', value: '350', icon: Users, color: 'blue' },
    { label: 'Participantes', value: '110', icon: UserPlus, color: 'emerald' },
    { label: 'Links Criados', value: '6', icon: TrendingUp, color: 'purple' },
    { label: 'Links Ativos', value: '40', icon: Activity, color: 'orange' }
  ];

  const chartData = {
    grupos: [
      { name: 'LINKS - PRIMEIRO PASSO', value: 85, color: '#ef4444' },
      { name: 'LINKS - SEGUNDO PASSO', value: 15, color: '#ef4444' },
      { name: 'LINKS - TERCEIRO PASSO', value: 5, color: '#ef4444' },
      { name: 'LINKS - QUARTO PASSO', value: 3, color: '#ef4444' },
      { name: 'LINKS - ONLINE', value: 2, color: '#ef4444' }
    ],
    participantesTipo: [
      { name: 'LINKS - PRIMEIRO PASSO', value: 85, color: '#3b82f6' },
      { name: 'LINKS - SEGUNDO PASSO', value: 15, color: '#3b82f6' },
      { name: 'LINKS - TERCEIRO PASSO', value: 5, color: '#3b82f6' },
      { name: 'LINKS - QUARTO PASSO', value: 3, color: '#3b82f6' },
      { name: 'LINKS - ONLINE', value: 2, color: '#3b82f6' }
    ],
    cargos: [
      { name: 'LINKS - LIDER', value: 200, color: '#10b981' },
      { name: 'LINKS - AUXILIAR', value: 100, color: '#10b981' },
      { name: 'LINKS - COORDENADOR', value: 50, color: '#10b981' },
      { name: 'LINKS - SUPERVISOR', value: 30, color: '#10b981' },
      { name: 'LINKS - INSTRUTOR', value: 25, color: '#10b981' },
      { name: 'LINKS - PRESIDENTE', value: 20, color: '#10b981' }
    ]
  };

  const renderChart = (data: Array<{ name: string; value: number; color: string }>, title: string, color: string) => {
    return (
      <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={data} title={title} color={color} height={350} />
        </CardContent>
      </Card>
    );
  };



  // Conteúdo da aba Detalhes
  const detalhesContent = (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {statsData.map((stat, index) => (
          <Card key={index} className="glass bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs font-medium">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className={`text-xs ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`w-8 h-8 bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4" />
                <Input
                  placeholder="Pesquisar..."
                  className="pl-10 backdrop-blur-sm border border-white/10 text-white placeholder:text-white/40 h-10 bg-white/5"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 bg-cyan-500/5"
              >
                Filtrar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 bg-cyan-500/5"
              >
                Exportar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 bg-cyan-500/5"
              >
                Com Atividade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaders Table */}
      <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg">Líderes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Pontos</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Cargo</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Ranking</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Batismo</th>
                  <th className="text-right py-3 px-4 text-white/60 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {leaderData.map((leader) => (
                  <tr key={leader.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white text-sm">{leader.name}</td>
                    <td className="py-3 px-4 text-white/60 text-sm">{leader.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                        {leader.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-white text-sm">{leader.points}</td>
                    <td className="py-3 px-4 text-white/60 text-sm">{leader.position}</td>
                    <td className="py-3 px-4">
                      <Badge variant={leader.ranking === 'Sim' ? 'default' : 'secondary'}
                        className={leader.ranking === 'Sim' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}>
                        {leader.ranking}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={leader.baptism === 'Sim' ? 'default' : 'secondary'}
                        className={leader.baptism === 'Sim' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}>
                        {leader.baptism}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg">Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Telefone</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Líder</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Data</th>
                  <th className="text-right py-3 px-4 text-white/60 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {participantData.map((participant) => (
                  <tr key={participant.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white text-sm">{participant.name}</td>
                    <td className="py-3 px-4 text-white/60 text-sm">{participant.email}</td>
                    <td className="py-3 px-4 text-white/60 text-sm">{participant.phone}</td>
                    <td className="py-3 px-4 text-white/60 text-sm">{participant.leader}</td>
                    <td className="py-3 px-4">
                      <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                        {participant.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-sm">{participant.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-white/60 text-sm">
          Mostrando 1 a 10 de 100 resultados
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/10">
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/10">
            Próximo
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Conteúdo da aba Gráficos
  const graficosContent = (
    <div className="space-y-6">
      {/* Stats Cards para Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {chartStatsData.map((stat, index) => (
          <Card key={index} className="glass bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs font-medium">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`w-8 h-8 bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="space-y-6">
        {renderChart(chartData.grupos, 'LINKs - Quantidade de Grupos', '#ef4444')}
        {renderChart(chartData.participantesTipo, 'LINKs - Participantes por Tipo', '#3b82f6')}
        {renderChart(chartData.cargos, 'LINKs - Quantidade de Cargos', '#10b981')}
      </div>
    </div>
  );

  // Configuração das tabs
  const tabItems: TabItem[] = [
    {
      id: 'detalhes',
      label: 'Detalhes',
      content: detalhesContent
    },
    {
      id: 'graficos',
      label: 'Gráficos',
      icon: BarChart3,
      content: graficosContent
    }
  ];

  return (
    <>
      <PageHeader
        title="Zion Links"
        description="Gerencie os links e conexões da sua comunidade."
        actions={
          <div className="flex space-x-3">
            <Button variant="outline" className="h-12 border-white/10 text-white hover:bg-white/10">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline" className="h-12 border-white/10 text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button className="h-12 shadow-lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Link
            </Button>
          </div>
        }
      />

      {/* Tabs Component */}
      <Tabs items={tabItems} defaultTab="detalhes" variant="figma" />

    </>
  );
}