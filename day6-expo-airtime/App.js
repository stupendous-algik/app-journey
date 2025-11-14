import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, FlatList, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = '@reminders_v1';

export default function App() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setReminders(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to load reminders', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const normalizePhone = (input) => {
    const p = input.replace(/\s+/g, '').replace(/^\+/, '');
    // Accept 07..., 01..., 2547..., 2541...
    if (/^(07|01)\\d{8}$/.test(p)) return '254' + p.slice(1);
    if (/^254(7|1)\\d{8}$/.test(p)) return p;
    return null;
  };

  const saveReminders = async (list) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setReminders(list);
    } catch (e) {
      Alert.alert('Save error', 'Could not save reminder.');
    }
  };

  const handleAdd = () => {
    const n = normalizePhone(phone.trim());
    if (!n) return Alert.alert('Invalid phone', 'Use 07..., 01..., or 2547..., 2541...');
    const amt = Number(amount);
    if (!amt || amt <= 0) return Alert.alert('Invalid amount', 'Enter a positive airtime amount.');

    const newItem = { id: uuidv4(), phone: n, amount: amt, createdAt: new Date().toISOString() };
    const list = [...reminders, newItem];
    saveReminders(list);
    setPhone('');
    setAmount('');
  };

  const handleDelete = (id) => {
    const list = reminders.filter(r => r.id !== id);
    saveReminders(list);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View>
        <Text style={styles.phone}>{item.phone}</Text>
        <Text style={styles.amount}>Ksh {item.amount}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Airtime Reminder</Text>
      <View style={styles.form}>
        <TextInput placeholder="Phone (e.g. 0712345678)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
        <TextInput placeholder="Amount (Ksh)" value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.input} />
        <Button title="Save Reminder" onPress={handleAdd} />
      </View>

      <View style={styles.listWrap}>
        {loading ? <Text>Loading…</Text> : (reminders.length === 0 ? <Text style={styles.empty}>No reminders yet.</Text> :
          <FlatList data={reminders} keyExtractor={item => item.id} renderItem={renderItem} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#fff' },
  title: { fontSize:22, fontWeight:'700', marginBottom:12, textAlign:'center' },
  form: { marginBottom:16 },
  input: { borderWidth:1, borderColor:'#ddd', padding:10, borderRadius:8, marginBottom:10 },
  listWrap: { flex:1 },
  empty: { textAlign:'center', color:'#666' },
  item: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderWidth:1, borderColor:'#f0f0f0', borderRadius:8, marginBottom:10, backgroundColor:'#fafafa' },
  phone: { fontFamily:'monospace', fontWeight:'600' },
  amount: { color:'#d32f2f', marginTop:4 },
  deleteBtn: { padding:6 },
  deleteText: { color:'#b00020' }
});
