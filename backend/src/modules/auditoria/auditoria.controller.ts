import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('auditoria')
export class AuditoriaController {
    constructor(private readonly auditoriasService: AuditoriaService,) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get()
    buscarTodas() {
        return this.auditoriasService.buscarTodas();
    }
}