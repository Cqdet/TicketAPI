import { CategoryChannel, Guild, Member, TextChannel } from "eris";
import MessageEmbed from './utils/MessageEmbed';

interface APIConfiguration {
    ticketCategoryID: string;
    supportTeamRoleID: string;
    ticketLogChannelID: string;
    autoSaveTickets: boolean;
    pingOnNewTicket: boolean;
}

class API {
    private static options: APIConfiguration
    public static configureAPI(options: APIConfiguration) {
        this.options = options;
    }

    /**
     * Main function to create a ticket
     * @param guild Server to create the ticket in
     * @param member Member that wants to create a ticket
     * @param topic The topic of the ticket
     */
    public static async createTicket(guild: Guild, member: Member, topic: string): Promise<void> {
        const { ticketCategoryID, supportTeamRoleID, pingOnNewTicket } = this.options
        let tickets = guild.channels.get(ticketCategoryID);
        if (!tickets) throw Error('Invalid Ticket Channel: Channel not found');
        if (tickets !instanceof CategoryChannel) throw Error('Invalid Ticket Channel: Invalid channel type');
        await guild.createChannel(`ticket-${this.tag(member)}`, 0, 'Ticket Protocol', {
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: 0, // Worry later
                    deny: 0x7FF7FDFF, // Worry later
                    type: 'role'                },
                {
                    id: supportTeamRoleID,
                    allow: 0x5FC40, // Worry later
                    deny: 0, // Worry later
                    type: 'role'
                },
                {
                    id: member.id,
                    allow: 0x1DC00, // Worry later
                    deny: 0, // Worry later
                    type: 'member'
                }
            ],
            parentID: ticketCategoryID,
            topic: `Ticket regarding from ${this.tag(member)}: ${topic}`,
            reason: 'Ticket Protocol',
        }).then(async (createdTicketChannel: TextChannel) => {
            const e = new MessageEmbed()
                .setTitle(`New Ticket`)
                .setDescription(
                    `**Topic:** ${topic}
                    **Ticket Creator**: <@${member.id}>`
                    )
                .setFooter(`Ticket created by ${this.tag(member)}`, member.avatarURL)
                .setTimestamp(new Date());
            await createdTicketChannel.createMessage(e).then(async() => {
                if(pingOnNewTicket) {
                    await createdTicketChannel.createMessage(`New Ticket: <&${supportTeamRoleID}>`)
                } else {
                    return;
                }
            });
        });
    }

    /**
     * Main function to close a ticket
     * @param channel Ticket channel that should be closed
     * @param member 
     */
    public static async closeTicket(channel: TextChannel, createdBy: Member, closedBy: Member) {
        const e = new MessageEmbed()
            .setTitle(`Closing Ticket: ${this.tag(createdBy)}`)
            .setDescription('Closing Ticket in 5 seconds...')
            .setFooter(`Ticket closed by: ${this.tag(closedBy)}`, closedBy.avatarURL)
            .setTimestamp(new Date());
        await channel.createMessage(e);
        setTimeout(async() => {
            await channel.delete('Ticket Protocol');
        }, 5000)
    }

    public static async createTicketTranscript(channel: TextChannel, createdBy: Member, closedBy: Member) {
        let arr: string[] = [];
        arr[0] = `Ticket Creator: ${this.tag(createdBy)}` // By API standard, first array element will be the creator
        arr[1] = `Ticker Closer: ${this.tag(closedBy)}` // By API standard, second array element will be the closer
        let messages = channel.messages.map(msg => msg);
        for (let message of messages) {
            arr.push(
                `
                --- Start of Message ---
                Author: ${message.author.username}#${message.author.discriminator}\n
                Content: ${message.content || 'Embed or Attachment'}
                Timestamp: ${message.timestamp}
                --- End of Message ---
                `);
        }
        return arr;
        /**
         * You has the developer need to decide what to do with the data
         * (i.e Write it to a text file and send it, Save it in a formatted html document)
         */
    }

    /**
     * Internal API util to get a tag of a member
     * @param member 
     */
    private static tag(member: Member) {
        return `${member.username || member.user.username}#${member.discriminator || member.user.discriminator}`
    }
}
export default API;