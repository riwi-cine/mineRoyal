import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { get } from 'node:http';
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'

@Controller('users')
export class UsersController {

    constructor (
        private readonly usersService: UsersService,
    ) {}

    @Get()
    getUsers() {
        return this.usersService.findAll()
    }

    @Get(':id') 
    findOne (@Param('id') id: string){
        return this.usersService.findOne(id)
    }

    @Post()
    CreateUsers (@Body() body: CreateUserDto) {
        return this.usersService.create(body)
    }
};
